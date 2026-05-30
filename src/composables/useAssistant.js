import { computed, ref } from 'vue'

import docsectorConfig from 'docsector.config.js'
import { normalizeAiAssistantConfig } from '../ai-assistant/config'
import { createAssistantRequestPayload } from '../ai-assistant/messages'
import { extractAssistantStreamDelta, normalizeAssistantSourceChunks, parseServerSentEvents } from '../ai-assistant/stream'

const assistantConfig = normalizeAiAssistantConfig(docsectorConfig)

function createMessage (role, content = '') {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content
  }
}

function getCompletionText (payload) {
  return payload?.choices?.[0]?.message?.content
    || payload?.response
    || payload?.content
    || ''
}

export default function useAssistant ({ route, locale, getContext } = {}) {
  const messages = ref([])
  const sources = ref([])
  const loading = ref(false)
  const error = ref('')
  const abortController = ref(null)

  const hasMessages = computed(() => messages.value.length > 0)

  const clear = () => {
    messages.value = []
    sources.value = []
    error.value = ''
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
          appendAssistantContent(assistantMessage, delta.content)
          if (delta.chunks.length > 0) {
            sources.value = delta.chunks
          }
        }
      }
    }

    if (buffer.trim()) {
      const events = parseServerSentEvents(`${buffer}\n\n`)
      for (const event of events) {
        const delta = extractAssistantStreamDelta(event)
        appendAssistantContent(assistantMessage, delta.content)
        if (delta.chunks.length > 0) {
          sources.value = delta.chunks
        }
      }
    }
  }

  const send = async (content) => {
    const prompt = String(content || '').trim()
    if (!prompt || loading.value) return

    error.value = ''
    sources.value = []

    const userMessage = createMessage('user', prompt)
    const assistantMessage = createMessage('assistant')
    messages.value.push(userMessage, assistantMessage)

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
      if (contentType.includes('text/event-stream') && response.body) {
        await consumeStream(response, assistantMessage)
      } else {
        const payload = await response.json()
        assistantMessage.content = getCompletionText(payload)
        sources.value = normalizeAssistantSourceChunks(payload?.chunks)
      }

      if (!assistantMessage.content.trim()) {
        assistantMessage.content = 'No answer was returned for this request.'
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        error.value = err?.message || 'Assistant request failed.'
        assistantMessage.content = ''
      }
    } finally {
      loading.value = false
      abortController.value = null
    }
  }

  return {
    config: assistantConfig,
    messages,
    sources,
    loading,
    error,
    hasMessages,
    send,
    stop,
    clear
  }
}
