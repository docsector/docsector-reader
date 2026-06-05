import { computed, nextTick, ref, watch } from 'vue'

import docsectorConfig from 'docsector.config.js'
import { normalizeAiAssistantConfig } from '../ai-assistant/config'
import { createAssistantRequestPayload } from '../ai-assistant/messages'
import { clearAssistantSession, loadAssistantSession, saveAssistantSession } from '../ai-assistant/session'
import { extractAssistantStreamDelta, normalizeAssistantSourceChunks, parseServerSentEvents } from '../ai-assistant/stream'

const assistantConfig = normalizeAiAssistantConfig(docsectorConfig)
const assistantMessages = ref([])
const assistantSources = ref([])
let assistantSessionReady = false
let assistantSessionWatcherReady = false
let assistantSessionPersistTimer = null
let assistantSessionPersistencePaused = false

const ASSISTANT_SESSION_PERSIST_DEBOUNCE = 180

function createMessage (role, content = '') {
  const timestamp = Date.now()

  return {
    id: `${role}-${timestamp}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    timestamp
  }
}

function getCompletionText (payload) {
  return payload?.choices?.[0]?.message?.content
    || payload?.response
    || payload?.content
    || ''
}

function persistAssistantSessionNow () {
  saveAssistantSession({
    messages: assistantMessages.value,
    sources: assistantSources.value
  })
}

function cancelPersistAssistantSession () {
  if (assistantSessionPersistTimer !== null) {
    clearTimeout(assistantSessionPersistTimer)
    assistantSessionPersistTimer = null
  }
}

function schedulePersistAssistantSession ({ immediate = false } = {}) {
  if (assistantSessionPersistencePaused) {
    return
  }

  cancelPersistAssistantSession()

  if (immediate || typeof window === 'undefined') {
    persistAssistantSessionNow()
    return
  }

  assistantSessionPersistTimer = window.setTimeout(() => {
    assistantSessionPersistTimer = null
    persistAssistantSessionNow()
  }, ASSISTANT_SESSION_PERSIST_DEBOUNCE)
}

async function yieldAssistantStreamPaint () {
  await nextTick()

  if (typeof window === 'undefined') {
    return
  }

  await new Promise(resolve => {
    window.setTimeout(resolve, 0)
  })
}

function ensureAssistantSession () {
  if (!assistantSessionReady) {
    const session = loadAssistantSession()
    assistantMessages.value = session.messages
    assistantSources.value = session.sources
    assistantSessionReady = true
  }

  if (!assistantSessionWatcherReady) {
    watch([assistantMessages, assistantSources], () => {
      schedulePersistAssistantSession()
    }, { deep: true })
    assistantSessionWatcherReady = true
  }
}

export default function useAssistant ({ route, locale, getContext } = {}) {
  ensureAssistantSession()

  const messages = assistantMessages
  const sources = assistantSources
  const loading = ref(false)
  const error = ref('')
  const abortController = ref(null)

  const hasMessages = computed(() => messages.value.length > 0)

  const clear = () => {
    messages.value = []
    sources.value = []
    error.value = ''
    cancelPersistAssistantSession()
    clearAssistantSession()
  }

  const stop = () => {
    abortController.value?.abort()
    abortController.value = null
    loading.value = false
  }

  const appendAssistantContent = (message, content) => {
    if (!content) return
    message.content += content
  }

  const appendAssistantPlaceholder = () => {
    messages.value.push(createMessage('assistant'))
    return messages.value[messages.value.length - 1]
  }

  const consumeStream = async (response, assistantMessage) => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let reading = true

    while (reading) {
      const { done, value } = await reader.read()
      if (done) {
        reading = false
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split(/\r?\n\r?\n/)
      buffer = parts.pop() || ''

      for (const part of parts) {
        const events = parseServerSentEvents(`${part}\n\n`)
        for (const event of events) {
          const delta = extractAssistantStreamDelta(event)
          if (delta.done) return
          const hadContent = delta.content.length > 0
          const hadChunks = delta.chunks.length > 0
          appendAssistantContent(assistantMessage, delta.content)
          if (hadChunks) {
            sources.value = delta.chunks
          }

          if (hadContent || hadChunks) {
            await yieldAssistantStreamPaint()
          }
        }
      }
    }

    if (buffer.trim()) {
      const events = parseServerSentEvents(`${buffer}\n\n`)
      for (const event of events) {
        const delta = extractAssistantStreamDelta(event)
        const hadContent = delta.content.length > 0
        const hadChunks = delta.chunks.length > 0
        appendAssistantContent(assistantMessage, delta.content)
        if (hadChunks) {
          sources.value = delta.chunks
        }

        if (hadContent || hadChunks) {
          await yieldAssistantStreamPaint()
        }
      }
    }
  }

  const prepareRequest = () => {
    assistantSessionPersistencePaused = true
    cancelPersistAssistantSession()
    error.value = ''
    sources.value = []
  }

  const requestAssistantResponse = async (liveAssistantMessage) => {
    abortController.value = new AbortController()
    loading.value = true

    try {
      const payload = createAssistantRequestPayload({
        messages: messages.value
          .filter(message => message.content.trim())
          .map(({ role, content }) => ({ role, content })),
        route: route?.value || route,
        locale: locale?.value || locale,
        context: typeof getContext === 'function' ? getContext() : {}
      })

      const response = await fetch(assistantConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.value.signal
      })

      if (!response.ok) {
        let message = `Assistant request failed with ${response.status}`
        try {
          const payload = await response.json()
          message = payload?.error?.message || message
        } catch {
          // keep status message
        }
        throw new Error(message)
      }

      const contentType = response.headers.get('content-type') || ''
      if (response.body && (contentType.includes('text/event-stream') || contentType.trim() === '')) {
        await consumeStream(response, liveAssistantMessage)
      } else {
        const payload = await response.json()
        liveAssistantMessage.content = getCompletionText(payload)
        sources.value = normalizeAssistantSourceChunks(payload?.chunks)
      }

      if (!liveAssistantMessage.content.trim()) {
        liveAssistantMessage.content = 'No answer was returned for this request.'
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        error.value = err?.message || 'Assistant request failed.'
        liveAssistantMessage.content = ''
      }
    } finally {
      loading.value = false
      abortController.value = null
      assistantSessionPersistencePaused = false
      // Persist once after the streamed response settles; writing the whole
      // session on every chunk can block paints and make streaming appear buffered.
      schedulePersistAssistantSession({ immediate: true })
    }
  }

  const send = async (content) => {
    const prompt = String(content || '').trim()
    if (!prompt || loading.value) return

    prepareRequest()

    messages.value.push(createMessage('user', prompt))
    const liveAssistantMessage = appendAssistantPlaceholder()

    await requestAssistantResponse(liveAssistantMessage)
  }

  const retryFromUserMessage = async (messageId) => {
    const targetId = String(messageId || '')
    if (!targetId || loading.value) return

    const targetIndex = messages.value.findIndex(message => String(message?.id || '') === targetId)
    const targetMessage = messages.value[targetIndex]
    if (targetIndex === -1 || targetMessage?.role !== 'user' || !String(targetMessage?.content || '').trim()) {
      return
    }

    prepareRequest()

    messages.value = messages.value.slice(0, targetIndex + 1)
    const liveAssistantMessage = appendAssistantPlaceholder()

    await requestAssistantResponse(liveAssistantMessage)
  }

  return {
    config: assistantConfig,
    messages,
    sources,
    loading,
    error,
    hasMessages,
    send,
    retryFromUserMessage,
    stop,
    clear
  }
}
