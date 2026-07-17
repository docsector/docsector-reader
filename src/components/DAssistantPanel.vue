<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { copyToClipboard, useQuasar } from 'quasar'

import useAssistant from '../composables/useAssistant'
import {
  ASSISTANT_MESSAGE_WINDOW_SIZE,
  ASSISTANT_MESSAGE_WINDOW_STEP,
  formatAssistantMessageTime,
  getAssistantMessageWindow,
  hasVisibleAssistantHistoryAfter,
  isAssistantThinkingState
} from '../ai-assistant/panel'
import DPageTokens from './DPageTokens.vue'
import { hasMathSupport, loadMathSupport, sourceHasMath, tokenizePageSectionSource } from './page-section-tokens'

const emit = defineEmits(['close', 'resize'])

const props = defineProps({
  contextTitle: {
    type: String,
    default: ''
  },
  markdownUrl: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 0
  },
  resizable: {
    type: Boolean,
    default: false
  }
})

const siteFavicon = '/favicon.ico'

const resolveAssetUrl = (src = '') => {
  const raw = String(src || '').trim()
  if (!raw) return ''
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw

  try {
    return new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'https://localhost').href
  } catch {
    return raw
  }
}

const route = useRoute()
const $q = useQuasar()
const { t, locale } = useI18n()
const input = ref('')
const scrollArea = ref(null)
const visibleMessageLimit = ref(ASSISTANT_MESSAGE_WINDOW_SIZE)
const copiedMessageId = ref('')
const showScrollToBottom = ref(false)
const retryHistoryDialogOpen = ref(false)
const pendingRetryMessageId = ref('')
let scrollFrame = 0
let copiedMessageTimer = null
let revealingOlderMessages = false

const assistant = useAssistant({
  route,
  locale,
  getContext: () => ({
    title: props.contextTitle,
    markdownUrl: props.markdownUrl,
    selectedText: typeof window !== 'undefined' ? String(window.getSelection?.() || '') : '',
    includePageMarkdown: assistant.pageContext.value
  })
})

const prompts = computed(() => assistant.config.ui.suggestedPrompts)
const title = computed(() => assistant.config.ui.title || t('assistant.title'))
const subtitle = computed(() => assistant.config.ui.subtitle || t('assistant.subtitle'))
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return t('assistant.greeting.morning')
  if (hour < 18) return t('assistant.greeting.afternoon')
  return t('assistant.greeting.evening')
})

const panelTone = computed(() => $q.dark.isActive ? 'dark' : 'light')

const sourceHref = (source) => {
  const key = String(source?.key || '').trim()
  if (!key) return '#'
  if (/^https?:\/\//i.test(key) || key.startsWith('/')) return key
  return `/${key}`
}

const faviconFor = () => resolveAssetUrl(siteFavicon)

const sources = computed(() => assistant.sources.value)
const hasSources = computed(() => sources.value.length > 0 && assistant.config.ui.showCitations)
const sourceAvatars = computed(() => sources.value.slice(0, 4))
const sourcesLabel = computed(() => t('assistant.sourcesCount', { count: sources.value.length }))
const messageWindow = computed(() => getAssistantMessageWindow(assistant.messages.value, visibleMessageLimit.value))
const visibleMessages = computed(() => messageWindow.value.messages)
const hasOlderMessages = computed(() => messageWindow.value.hiddenCount > 0)
const streamingAssistantMessageId = computed(() => {
  if (!assistant.loading.value) {
    return ''
  }

  const lastMessage = assistant.messages.value[assistant.messages.value.length - 1]
  return lastMessage?.role === 'assistant' ? String(lastMessage.id || '') : ''
})
const latestAssistantMessageId = computed(() => {
  for (let index = assistant.messages.value.length - 1; index >= 0; index -= 1) {
    const message = assistant.messages.value[index]
    if (message?.role === 'assistant' && String(message?.content || '').trim()) {
      return String(message.id || '')
    }
  }

  return ''
})

const isThinking = computed(() => isAssistantThinkingState({
  loading: assistant.loading.value,
  messages: assistant.messages.value
}))

const isStreamingAssistantMessage = (message) => {
  return String(message?.id || '') !== '' && String(message?.id || '') === streamingAssistantMessageId.value
}

const hasMessageContent = (message) => {
  return String(message?.content || '').trim().length > 0
}

const messageTime = (message) => {
  return formatAssistantMessageTime(message, locale.value)
}

const messageHasSources = (message) => {
  return hasSources.value && String(message?.id || '') === latestAssistantMessageId.value
}

// ? Math (katex) loads on demand — answers with math re-render once it lands
const mathTick = ref(0)

const renderMessageTokens = (message) => {
  if (message?.role !== 'assistant') {
    return []
  }

  const content = message?.content || ''

  // Reading mathTick makes the render re-run when math support arrives
  if (mathTick.value >= 0 && !hasMathSupport() && sourceHasMath(content)) {
    loadMathSupport().then(() => {
      mathTick.value++
    })
  }

  // ? force the meta row on: answers are mostly copyable one-liners (a shell
  //   command, an install line), and a model rarely bothers with a fence
  //   attribute — an explicit :toolbar="false"; in the answer still wins
  return tokenizePageSectionSource(content, {
    allowHeadingTokens: false,
    codeToolbarDefault: true
  })
}

const startResize = (event) => {
  if (!props.resizable) return
  event.preventDefault()
  const startX = event.clientX
  const startWidth = props.width || 380

  const onMove = (moveEvent) => {
    const delta = startX - moveEvent.clientX
    emit('resize', startWidth + delta)
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

const getScrollTarget = () => {
  return scrollArea.value?.getScrollTarget?.()
    || scrollArea.value?.$el?.querySelector('.q-scrollarea__container')
}

const applyBottomScroll = () => {
  const target = getScrollTarget()
  scrollArea.value?.setScrollPosition?.('vertical', Number.MAX_SAFE_INTEGER, 0)
  if (target) {
    target.scrollTop = target.scrollHeight
  }
}

const scrollToBottom = ({ attempts = 6 } = {}) => {
  if (typeof window === 'undefined') {
    return
  }

  if (scrollFrame !== 0) {
    window.cancelAnimationFrame(scrollFrame)
  }

  const run = (remainingAttempts) => {
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0

      nextTick(() => {
        applyBottomScroll()
        if (remainingAttempts > 0) {
          run(remainingAttempts - 1)
        }
      })
    })
  }

  run(attempts)
}

const loadOlderMessages = async () => {
  if (!hasOlderMessages.value || revealingOlderMessages) return

  revealingOlderMessages = true
  const target = getScrollTarget()
  const previousHeight = target?.scrollHeight || 0
  visibleMessageLimit.value += ASSISTANT_MESSAGE_WINDOW_STEP

  await nextTick()

  const nextTarget = getScrollTarget()
  if (nextTarget) {
    nextTarget.scrollTop += Math.max(0, nextTarget.scrollHeight - previousHeight)
  }

  revealingOlderMessages = false
}

const syncScrollToBottomVisibility = () => {
  const target = getScrollTarget()
  if (!target || !assistant.hasMessages.value) {
    showScrollToBottom.value = false
    return
  }

  const maxTop = Math.max(0, target.scrollHeight - target.clientHeight)
  const distanceToBottom = maxTop - target.scrollTop
  showScrollToBottom.value = distanceToBottom > 120
}

const handleScroll = (info = {}) => {
  syncScrollToBottomVisibility()

  const position = Number(info.verticalPosition ?? info.position?.top ?? 0)
  if (position <= 80) {
    loadOlderMessages()
  }
}

const notifyMessageCopied = () => {
  $q.notify({
    message: t('assistant.copied'),
    color: 'positive',
    textColor: 'white',
    icon: 'check',
    position: 'top',
    timeout: 1200
  })
}

const copyMessage = (message) => {
  const content = String(message?.content || '').trim()
  const id = String(message?.id || '')
  if (!content || !id) return

  copyToClipboard(content)
    .then(() => {
      copiedMessageId.value = id
      notifyMessageCopied()

      if (copiedMessageTimer !== null) {
        window.clearTimeout(copiedMessageTimer)
      }

      copiedMessageTimer = window.setTimeout(() => {
        copiedMessageId.value = ''
        copiedMessageTimer = null
      }, 1600)
    })
    .catch(() => {})
}

const messageCopyIcon = (message) => {
  return copiedMessageId.value === String(message?.id || '') ? 'check' : 'content_copy'
}

const runRetryMessage = async (messageId) => {
  const id = String(messageId || '')
  if (!id) return
  await assistant.retryFromUserMessage(id)
}

const retryMessage = async (message) => {
  const id = String(message?.id || '')
  if (!id || assistant.loading.value) return

  if (hasVisibleAssistantHistoryAfter(assistant.messages.value, id)) {
    pendingRetryMessageId.value = id
    retryHistoryDialogOpen.value = true
    return
  }

  await runRetryMessage(id)
}

const clearPendingRetryMessage = () => {
  pendingRetryMessageId.value = ''
}

const cancelRetryMessage = () => {
  retryHistoryDialogOpen.value = false
  clearPendingRetryMessage()
}

const confirmRetryMessage = async () => {
  const id = pendingRetryMessageId.value
  retryHistoryDialogOpen.value = false
  clearPendingRetryMessage()
  await runRetryMessage(id)
}

const submit = async (value = input.value) => {
  const prompt = String(value || '').trim()
  if (!prompt) return
  input.value = ''
  await assistant.send(prompt)
}

const togglePageContext = () => assistant.setPageContext(!assistant.pageContext.value)

const submitPrompt = async (prompt) => {
  // Page-dependent prompts turn the toggle on, so the chip lights up and the
  // reader can see why this prompt gets the page attached.
  if (prompt?.pageContext === true) assistant.setPageContext(true)
  await submit(prompt?.text)
}

const scrollToBottomAction = () => {
  showScrollToBottom.value = false
  scrollToBottom({ attempts: 10 })
}

const handleKeydown = (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return
  event.preventDefault()
  submit()
}

watch(assistant.messages, () => scrollToBottom({ attempts: 6 }), { deep: true })
watch(assistant.sources, () => scrollToBottom({ attempts: 4 }), { deep: true })
watch(() => assistant.messages.value.length, (length, previousLength) => {
  if (length < previousLength) {
    visibleMessageLimit.value = ASSISTANT_MESSAGE_WINDOW_SIZE
  }

  if (length === 0) {
    showScrollToBottom.value = false
  }
})

onMounted(() => {
  scrollToBottom({ attempts: 14 })
  nextTick(syncScrollToBottomVisibility)
})

onBeforeUnmount(() => {
  if (scrollFrame !== 0 && typeof window !== 'undefined') {
    window.cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
  }

  if (copiedMessageTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(copiedMessageTimer)
    copiedMessageTimer = null
  }
})
</script>

<template>
<aside class="d-assistant-panel" :class="`d-assistant-panel--${panelTone}`">
  <div
    v-if="resizable"
    class="d-assistant-panel__resizer"
    role="separator"
    aria-orientation="vertical"
    :aria-label="t('assistant.resize')"
    @pointerdown="startResize"
  />
  <header class="d-assistant-panel__header">
    <div class="d-assistant-panel__brand">
      <q-icon name="auto_awesome" size="22px" />
      <strong>{{ title }}</strong>
    </div>
    <div class="d-assistant-panel__header-actions">
      <q-btn v-if="assistant.hasMessages.value"
        dense round
        color="white"
        class="d-assistant-panel__header-action d-assistant-panel__header-action--clear"
        icon="delete_outline"
        text-color="negative"
        :aria-label="t('assistant.clear')"
        @click="assistant.clear"
      >
        <q-tooltip>{{ t('assistant.clear') }}</q-tooltip>
      </q-btn>
      <q-btn
        dense round
        color="white"
        text-color="black"
        class="d-assistant-panel__header-action d-assistant-panel__header-action--close"
        icon="close"
        :aria-label="t('assistant.close')"
        @click="emit('close')"
      >
        <q-tooltip>{{ t('assistant.close') }}</q-tooltip>
      </q-btn>
    </div>
  </header>

  <q-scroll-area ref="scrollArea" class="d-assistant-panel__body" @scroll="handleScroll">
    <div v-if="!assistant.hasMessages.value" class="d-assistant-panel__empty">
      <div class="d-assistant-panel__mark">
        <q-icon name="auto_awesome" size="52px" />
      </div>
      <h2>{{ greeting }}</h2>
      <p>{{ subtitle }}</p>
    </div>

    <div v-else class="d-assistant-panel__messages">
      <div v-if="hasOlderMessages" class="d-assistant-panel__older">
        <q-btn
          dense no-caps unelevated
          icon="expand_less"
          color="white"
          text-color="primary"
          class="d-assistant-panel__older-action"
          :label="t('assistant.loadEarlier')"
          @click="loadOlderMessages"
        />
      </div>

      <div
        v-for="(message, index) in visibleMessages"
        :key="message.id"
        class="d-assistant-message"
        :class="`d-assistant-message--${message.role}`"
      >
        <div
          v-if="message.role === 'assistant' && isStreamingAssistantMessage(message)"
          class="d-assistant-message__content d-assistant-message__content--streaming"
        >
          {{ message.content }}
        </div>
        <div
          v-else-if="message.role === 'assistant'"
          class="content no-padding d-assistant-message__content d-assistant-message__content--markdown"
        >
          <d-page-tokens :id="(index + 1) * 1000" :tokens="renderMessageTokens(message)" />
        </div>
        <div v-else class="d-assistant-message__content">{{ message.content }}</div>

        <div
          v-if="message.role === 'assistant' && hasMessageContent(message)"
          class="d-assistant-message__footer"
        >
          <q-btn
            flat dense
            text-color="primary"
            class="d-assistant-message__action d-assistant-message__copy d-assistant-message__copy--assistant"
            :icon="messageCopyIcon(message)"
            :aria-label="t('assistant.copyMessage')"
            @click="copyMessage(message)"
          >
            <q-tooltip>{{ t('assistant.copyMessage') }}</q-tooltip>
          </q-btn>

          <q-chip
            v-if="messageHasSources(message)"
            clickable
            class="d-assistant-sources-chip"
            :ripple="false"
          >
            <span class="d-assistant-sources-chip__avatars">
              <q-avatar
                v-for="(source, sourceIndex) in sourceAvatars"
                :key="source.id"
                class="d-assistant-sources-chip__avatar"
                :style="{ zIndex: sourceAvatars.length - sourceIndex }"
                size="24px"
              >
                <img :src="faviconFor(source)" :alt="source.title" loading="lazy">
              </q-avatar>
            </span>
            <span class="d-assistant-sources-chip__label">{{ sourcesLabel }}</span>
            <q-icon name="expand_more" size="16px" />

            <q-menu
              anchor="top left"
              self="bottom left"
              :offset="[0, 8]"
              class="d-assistant-sources-menu"
            >
              <q-list separator class="d-assistant-sources-menu__list">
                <q-item-label header class="d-assistant-sources-menu__header">
                  {{ t('assistant.sources') }}
                </q-item-label>
                <q-item
                  v-for="source in sources"
                  :key="source.id"
                  v-close-popup
                  clickable
                  tag="a"
                  :href="sourceHref(source)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <q-item-section avatar>
                    <q-avatar size="28px" class="d-assistant-sources-menu__avatar">
                      <img :src="faviconFor(source)" :alt="source.title" loading="lazy">
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label lines="1">{{ source.title }}</q-item-label>
                    <q-item-label v-if="source.meta" caption lines="1">{{ source.meta }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="open_in_new" size="16px" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-chip>

          <span
            v-if="messageTime(message)"
            class="d-assistant-message__timestamp"
          >{{ messageTime(message) }}</span>
        </div>

        <div
          v-else-if="message.role === 'user' && hasMessageContent(message)"
          class="d-assistant-message__footer d-assistant-message__footer--user"
        >
          <div class="d-assistant-message__hoverlayer">
            <q-btn
              v-if="!assistant.loading.value"
              flat dense
              text-color="primary"
              class="d-assistant-message__action d-assistant-message__retry"
              icon="refresh"
              :aria-label="t('assistant.retryMessage')"
              @click="retryMessage(message)"
            >
              <q-tooltip>{{ t('assistant.retryMessage') }}</q-tooltip>
            </q-btn>
            <q-btn
              flat dense
              text-color="primary"
              class="d-assistant-message__action d-assistant-message__copy d-assistant-message__copy--user"
              :icon="messageCopyIcon(message)"
              :aria-label="t('assistant.copyMessage')"
              @click="copyMessage(message)"
            >
              <q-tooltip>{{ t('assistant.copyMessage') }}</q-tooltip>
            </q-btn>
            <span
              v-if="messageTime(message)"
              class="d-assistant-message__timestamp"
            >{{ messageTime(message) }}</span>
          </div>
        </div>
      </div>

      <div v-if="isThinking" class="d-assistant-message d-assistant-message--assistant">
        <div class="d-assistant-message__content d-assistant-message__thinking">
          <q-spinner-dots size="22px" />
          <span>{{ t('assistant.thinking') }}</span>
        </div>
      </div>
    </div>

    <div v-if="assistant.error.value" class="d-assistant-panel__error">
      <q-icon name="error_outline" />
      <span>{{ assistant.error.value }}</span>
    </div>

  </q-scroll-area>

  <q-btn
    v-if="showScrollToBottom && assistant.hasMessages.value"
    round
    unelevated
    color="primary"
    text-color="white"
    class="d-assistant-panel__scroll-bottom"
    icon="keyboard_arrow_down"
    aria-label="Scroll to bottom"
    @click="scrollToBottomAction"
  >
    <q-tooltip>Scroll to bottom</q-tooltip>
  </q-btn>

  <footer class="d-assistant-panel__composer">
    <div v-if="!assistant.hasMessages.value" class="d-assistant-panel__prompts">
      <q-btn
        v-for="prompt in prompts"
        :key="prompt.text"
        dense no-caps unelevated
        class="d-assistant-panel__prompt"
        @click="submitPrompt(prompt)"
      >
        {{ prompt.text }}
      </q-btn>
    </div>

    <div class="d-assistant-panel__composer-box">
      <q-input
        v-model="input"
        class="d-assistant-panel__input"
        borderless
        autogrow
        dense
        :placeholder="t('assistant.placeholder')"
        :disable="assistant.loading.value"
        @keydown="handleKeydown"
      />
      <div class="d-assistant-panel__composer-row">
        <q-chip
          clickable
          :ripple="false"
          class="d-assistant-panel__context"
          :class="{ 'd-assistant-panel__context--on': assistant.pageContext.value }"
          role="switch"
          :aria-checked="assistant.pageContext.value ? 'true' : 'false'"
          :aria-label="t('assistant.pageContext.label')"
          @click="togglePageContext"
        >
          <q-icon name="description" size="16px" />
          <span class="d-assistant-panel__context-label">{{ t('assistant.pageContext.label') }}</span>
          <q-tooltip>
            {{ assistant.pageContext.value ? t('assistant.pageContext.on') : t('assistant.pageContext.off') }}
          </q-tooltip>
        </q-chip>
        <q-btn
          no-caps flat dense
          class="d-assistant-panel__send"
          :icon="assistant.loading.value ? 'stop' : 'send'"
          :label="assistant.loading.value ? t('assistant.stop') : t('assistant.send')"
          @click="assistant.loading.value ? assistant.stop() : submit()"
        />
      </div>
    </div>
  </footer>

  <q-dialog v-model="retryHistoryDialogOpen" @hide="clearPendingRetryMessage">
    <q-card class="d-assistant-retry-dialog">
      <q-card-section class="d-assistant-retry-dialog__header">
        <q-icon name="warning_amber" size="24px" />
        <div>
          <h3>{{ t('assistant.retryHistoryTitle') }}</h3>
          <p>{{ t('assistant.retryHistoryMessage') }}</p>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="d-assistant-retry-dialog__actions">
        <q-btn
          unelevated no-caps
          color="grey-7"
          text-color="white"
          :label="t('assistant.retryHistoryCancel')"
          @click="cancelRetryMessage"
        />
        <q-btn
          unelevated no-caps
          color="primary"
          :label="t('assistant.retryHistoryConfirm')"
          @click="confirmRetryMessage"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</aside>
</template>

<style lang="sass">
.d-assistant-panel
  height: 100%
  display: flex
  flex-direction: column
  background: #f8fafc
  color: #111827
  overflow: hidden
  position: relative

  &.d-mobile-assistant-panel
    width: 100vw
    max-width: 100vw
    height: 100dvh
    max-height: 100dvh

    .d-assistant-panel__header
      padding-top: env(safe-area-inset-top, 0px)
      min-height: calc(54px + env(safe-area-inset-top, 0px))

    .d-assistant-panel__composer
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px))

  &__resizer
    position: absolute
    top: 0
    left: 0
    width: 7px
    height: 100%
    cursor: col-resize
    z-index: 5
    touch-action: none

    &::after
      content: ''
      position: absolute
      top: 0
      left: 2px
      width: 2px
      height: 100%
      background: transparent
      transition: background 0.15s ease

    &:hover::after
      background: var(--q-primary)

  &--dark
    background: #1b1b1c
    color: rgba(255, 255, 255, 0.86)

    .d-assistant-panel__composer
      background: linear-gradient(180deg, rgba(27,27,28,0), rgba(41, 24, 20, 0.72) 34%, #1b1b1c 100%)

    .d-assistant-message--assistant .d-assistant-message__content,
    .d-assistant-panel__older-action,
    .d-assistant-panel__prompt,
    .d-assistant-sources-chip
      background: rgba(255, 255, 255, 0.045)
      color: rgba(255, 255, 255, 0.86)
      border-color: rgba(255, 255, 255, 0.12)

    .d-assistant-message__action
      color: rgba(255, 255, 255, 0.84)

    .d-assistant-sources-chip__avatar
      border-color: #1b1b1c

    .d-assistant-panel__mark
      color: #ffad98
      background: rgba(76, 35, 28, 0.35)

    .d-assistant-panel__composer-box
      background: rgba(24, 24, 24, 0.86)
      border-color: rgba(255, 142, 111, 0.74)
      box-shadow: 0 0 0 1px rgba(255, 142, 111, 0.3), 0 14px 36px rgba(0, 0, 0, 0.32)

    .d-assistant-panel__context
      border-color: rgba(255, 255, 255, 0.16)

      // Compound on purpose: `--dark .__context` is two classes and would
      // outrank the single-class `--on` modifier otherwise.
      &.d-assistant-panel__context--on
        border-color: rgba(255, 142, 111, 0.74)
        background: rgba(255, 142, 111, 0.18)
        color: #ffad98

    .d-assistant-panel__input
      .q-field__native,
      .q-field__input
        color: rgba(255, 255, 255, 0.88)

      .q-field__native::placeholder,
      .q-field__input::placeholder
        color: rgba(255, 255, 255, 0.48)

  &__header
    height: 54px
    flex: 0 0 54px
    display: flex
    align-items: center
    justify-content: space-between
    padding: 0 14px
    border-bottom: 1px solid rgba(125, 125, 125, 0.18)

  &__brand
    display: flex
    align-items: center
    gap: 8px
    min-width: 0

    strong
      font-size: 0.94rem
      white-space: nowrap
      overflow: hidden
      text-overflow: ellipsis

  &__header-actions
    flex: 0 0 auto
    display: flex
    align-items: center
    gap: 2px

  &__header-action
    background: rgba(15, 23, 42, 0.08)
    color: currentColor

    &:hover
      background: rgba(15, 23, 42, 0.14)

    &--clear
      margin-right: 8px

  &__body
    flex: 1 1 auto
    min-height: 0
    overflow-x: hidden

    .q-scrollarea__container,
    .q-scrollarea__content
      overflow-x: hidden
      max-width: 100%

  &__empty
    min-height: 100%
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    text-align: center
    padding: 32px 28px 170px

    h2
      font-size: 1.18rem
      line-height: 1.35rem
      font-weight: 700
      margin: 18px 0 4px

    p
      margin: 0
      opacity: 0.62
      font-weight: 600

  &__mark
    width: 120px
    height: 120px
    border-radius: 50%
    display: flex
    align-items: center
    justify-content: center
    color: #0284c7
    background: rgba(14, 165, 233, 0.12)

  &__messages
    padding: 16px 14px 8px
    overflow-x: hidden

  &__older
    display: flex
    justify-content: center
    margin: 0 0 12px

  &__older-action
    min-height: 32px
    padding: 0 12px
    border: 1px solid rgba(15, 23, 42, 0.12)
    background: rgba(255, 255, 255, 0.82)
    border-radius: 8px
    font-weight: 700

  &__error
    margin: 0 14px 96px
    padding: 10px 12px
    display: flex
    align-items: flex-start
    gap: 8px
    border: 1px solid rgba(194, 65, 12, 0.25)
    color: #b45309
    background: rgba(251, 191, 36, 0.12)
    border-radius: 8px

  &__scroll-bottom
    position: absolute
    left: 50%
    bottom: calc(90px + env(safe-area-inset-bottom, 0px))
    transform: translateX(-50%)
    z-index: 4
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.28)

  &__sources
    margin: 0 14px 0
    display: flex
    flex-direction: column
    align-items: flex-start
    gap: 6px
    overflow-x: hidden

  &__sources-title
    font-size: 0.76rem
    opacity: 0.7
    font-weight: 600

  &__composer
    flex: 0 0 auto
    padding: 18px 14px 16px
    background: linear-gradient(180deg, rgba(248,250,252,0), rgba(248,250,252,0.94) 28%, #f8fafc 100%)

  &__prompts
    display: flex
    flex-direction: column
    gap: 9px
    margin-bottom: 10px

  &__prompt
    justify-content: flex-start
    min-height: 38px
    padding: 0 13px
    border: 1px solid rgba(15, 23, 42, 0.1)
    background: rgba(255, 255, 255, 0.68)
    color: inherit
    border-radius: 10px
    font-weight: 600

  &__composer-box
    border: 1px solid rgba(15, 23, 42, 0.16)
    border-radius: 18px
    padding: 10px 12px 8px
    background: rgba(255, 255, 255, 0.78)
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12)

  &__input
    .q-field__control
      min-height: 36px
      background: transparent
      padding: 0

    .q-field__native,
    .q-field__input
      font-weight: 600

  &__composer-row
    display: flex
    align-items: center
    justify-content: space-between
    gap: 8px
    margin-top: 2px

  &__context
    height: auto
    min-height: 28px
    min-width: 0
    max-width: calc(100% - 92px)
    margin: 0
    padding: 3px 10px
    border: 1px solid rgba(15, 23, 42, 0.16)
    border-radius: 999px
    background: transparent
    color: inherit
    font-size: 0.76rem
    font-weight: 600
    opacity: 0.62
    transition: opacity 0.14s ease, background 0.14s ease, border-color 0.14s ease, color 0.14s ease

    // QChip renders slot children inside `.q-chip__content`, so the gap has to
    // live there — a gap on the root would do nothing.
    .q-chip__content
      gap: 5px
      min-width: 0

    &:hover
      opacity: 0.92

    &--on
      border-color: var(--q-primary)
      background: var(--q-primary)
      color: #fff
      opacity: 1

  &__context-label
    min-width: 0
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap

  &__send
    flex: 0 0 auto
    color: var(--q-primary)
    font-weight: 700

.d-assistant-message
  display: flex
  flex-direction: column
  align-items: flex-start
  margin-bottom: 10px
  min-width: 0
  overflow-x: hidden
  overflow-y: hidden
  position: relative

  &--user
    align-items: flex-end

    .d-assistant-message__content
      color: white
      background: var(--q-primary)

    &:hover .d-assistant-message__hoverlayer .d-assistant-message__action,
    &:focus-within .d-assistant-message__hoverlayer .d-assistant-message__action,
    .d-assistant-message__hoverlayer:hover .d-assistant-message__action,
    .d-assistant-message__hoverlayer:focus-within .d-assistant-message__action,
    &:hover .d-assistant-message__timestamp,
    &:focus-within .d-assistant-message__timestamp
      opacity: 1
      pointer-events: auto

  &--assistant
    align-items: flex-start

    .d-assistant-message__content
      background: none !important
      border: none
      padding: 0 !important
      max-width: 100%

    .d-assistant-message__footer
      justify-content: flex-start

    &:hover .d-assistant-message__timestamp,
    &:focus-within .d-assistant-message__timestamp
      opacity: 1

  &__content
    max-width: 88%
    min-width: 0
    padding: 10px 12px
    border-radius: 8px
    white-space: pre-wrap
    overflow-wrap: anywhere
    line-height: 1.45

    &--markdown
      min-height: 0 !important
      white-space: normal

      // Visuals come from Docsector's own page token components so the chat
      // stays identical to pages/subpages; only enforce bubble-safe spacing
      // and overflow containment here.
      p
        line-height: 1.6em

      p,
      ul,
      ol,
      blockquote,
      .d-table-wrapper
        margin-top: 0
        margin-bottom: 0.7em

      > :first-child
        margin-top: 0

      > :last-child
        margin-bottom: 0

      pre,
      table,
      .d-table-wrapper
        max-width: 100%
        overflow-x: auto

      img
        max-width: 100%
        height: auto

  &__footer
    width: 88%
    max-width: 88%
    min-width: 0
    display: flex
    align-items: center
    gap: 6px
    margin-top: 5px

    .d-assistant-sources-chip
      flex: 0 1 auto
      max-width: calc(100% - 92px)

    &--user
      width: auto
      max-width: none
      min-width: 30px
      height: 30px
      align-self: flex-end
      align-items: center
      justify-content: center

  &__action
    flex: 0 0 auto
    width: 30px
    height: 30px
    min-height: 30px
    min-width: 30px
    padding: 0
    border-radius: 6px

    .q-btn__content
      line-height: 1

      i
        font-size: 17px !important
        margin: 0

  &__copy
    &--assistant
      margin-left: -2px

  &__retry
    color: currentColor

  &__hoverlayer
    display: flex
    align-items: center
    justify-content: flex-end
    gap: 6px
    width: auto
    height: 30px
    min-width: 30px
    min-height: 30px

    .d-assistant-message__action
      opacity: 0
      pointer-events: none
      transition: opacity 0.14s ease

  &__timestamp
    flex: 0 0 auto
    margin-left: auto
    color: currentColor
    font-size: 0.72rem
    font-weight: 700
    font-variant-numeric: tabular-nums
    line-height: 30px
    opacity: 0
    pointer-events: none
    transition: opacity 0.14s ease

  &__hoverlayer &__timestamp
    margin-left: 0

  &__thinking
    display: flex
    align-items: center
    gap: 9px
    color: inherit
    opacity: 0.78
    font-weight: 600

.d-assistant-retry-dialog
  width: min(360px, calc(100vw - 32px))
  border-radius: 8px

  &__header
    display: flex
    align-items: flex-start
    gap: 12px
    padding: 18px 18px 10px

    h3
      margin: 0 0 6px
      font-size: 1rem
      line-height: 1.3
      font-weight: 800

    p
      margin: 0
      color: currentColor
      opacity: 0.72
      line-height: 1.45

  &__actions
    padding: 8px 12px 14px

.d-assistant-sources-chip
  max-width: 100%
  min-width: 0
  height: auto
  min-height: 34px
  padding: 4px 10px 4px 6px
  margin: 0
  border-radius: 999px
  background: rgba(255, 255, 255, 0.78)
  border: 1px solid rgba(15, 23, 42, 0.12)
  font-weight: 600

  &__avatars
    display: inline-flex
    align-items: center
    padding-left: 6px

  &__avatar
    display: inline-flex
    align-items: center
    justify-content: center
    flex: 0 0 24px
    position: relative
    background: var(--q-primary)
    border: 2px solid #f8fafc
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18)

    & + &
      margin-left: -11px

    img
      width: 100%
      height: 100%
      box-sizing: border-box
      object-fit: contain
      padding: 4px
      background: transparent

  &__label
    margin: 0 2px 0 8px
    font-size: 0.8rem
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

.d-assistant-sources-menu
  max-width: min(360px, 90vw)

  &__header
    padding: 8px 16px 6px
    font-weight: 700
    opacity: 0.7

  &__avatar
    background: var(--q-primary)

  &__list
    padding-bottom: 4px

    .q-item__section--avatar
      padding-left: 6px

    img
      box-sizing: border-box
      object-fit: contain
      padding: 5px
      background: transparent
</style>
