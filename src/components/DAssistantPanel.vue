<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

import useAssistant from '../composables/useAssistant'
import { isAssistantThinkingState, listVisibleAssistantMessages } from '../ai-assistant/panel'
import DPageTokens from './DPageTokens.vue'
import { tokenizePageSectionSource } from './page-section-tokens'

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

const assistant = useAssistant({
  route,
  locale,
  getContext: () => ({
    title: props.contextTitle,
    markdownUrl: props.markdownUrl,
    selectedText: typeof window !== 'undefined' ? String(window.getSelection?.() || '') : ''
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
const visibleMessages = computed(() => listVisibleAssistantMessages(assistant.messages.value))

const isThinking = computed(() => isAssistantThinkingState({
  loading: assistant.loading.value,
  messages: assistant.messages.value
}))

const renderMessageTokens = (message) => {
  if (message?.role !== 'assistant') {
    return []
  }

  return tokenizePageSectionSource(message?.content || '', { allowHeadingTokens: false })
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

const scrollToBottom = () => {
  nextTick(() => {
    const target = scrollArea.value?.$el?.querySelector('.q-scrollarea__container')
    if (target) {
      target.scrollTop = target.scrollHeight
    }
  })
}

const submit = async (value = input.value) => {
  const prompt = String(value || '').trim()
  if (!prompt) return
  input.value = ''
  await assistant.send(prompt)
}

const handleKeydown = (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return
  event.preventDefault()
  submit()
}

watch(assistant.messages, scrollToBottom, { deep: true })
watch(assistant.sources, scrollToBottom, { deep: true })
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

  <q-scroll-area ref="scrollArea" class="d-assistant-panel__body">
    <div v-if="!assistant.hasMessages.value" class="d-assistant-panel__empty">
      <div class="d-assistant-panel__mark">
        <q-icon name="auto_awesome" size="52px" />
      </div>
      <h2>{{ greeting }}</h2>
      <p>{{ subtitle }}</p>
    </div>

    <div v-else class="d-assistant-panel__messages">
      <div
        v-for="(message, index) in visibleMessages"
        :key="message.id"
        class="d-assistant-message"
        :class="`d-assistant-message--${message.role}`"
      >
        <div
          v-if="message.role === 'assistant'"
          class="content no-padding d-assistant-message__content d-assistant-message__content--markdown"
        >
          <d-page-tokens :id="(index + 1) * 1000" :tokens="renderMessageTokens(message)" />
        </div>
        <div v-else class="d-assistant-message__content">{{ message.content }}</div>
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

    <div v-if="hasSources" class="d-assistant-panel__sources">
      <q-chip
        clickable
        class="d-assistant-sources-chip"
        :ripple="false"
      >
        <span class="d-assistant-sources-chip__avatars">
          <q-avatar
            v-for="(source, index) in sourceAvatars"
            :key="source.id"
            class="d-assistant-sources-chip__avatar"
            :style="{ zIndex: sourceAvatars.length - index }"
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
              v-for="source in assistant.sources.value"
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
    </div>
  </q-scroll-area>

  <footer class="d-assistant-panel__composer">
    <div v-if="!assistant.hasMessages.value" class="d-assistant-panel__prompts">
      <q-btn
        v-for="prompt in prompts"
        :key="prompt"
        dense no-caps unelevated
        class="d-assistant-panel__prompt"
        @click="submit(prompt)"
      >
        {{ prompt }}
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
        <span class="d-assistant-panel__context">
          <q-icon name="smart_toy" size="16px" />
          {{ t('assistant.context') }}
        </span>
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
    .d-assistant-panel__prompt,
    .d-assistant-sources-chip
      background: rgba(255, 255, 255, 0.045)
      color: rgba(255, 255, 255, 0.86)
      border-color: rgba(255, 255, 255, 0.12)

    .d-assistant-sources-chip__avatar
      border-color: #1b1b1c

    .d-assistant-panel__mark
      color: #ffad98
      background: rgba(76, 35, 28, 0.35)

    .d-assistant-panel__composer-box
      background: rgba(24, 24, 24, 0.86)
      border-color: rgba(255, 142, 111, 0.74)
      box-shadow: 0 0 0 1px rgba(255, 142, 111, 0.3), 0 14px 36px rgba(0, 0, 0, 0.32)

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
    padding: 16px 14px 14px
    overflow-x: hidden

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
    display: inline-flex
    align-items: center
    gap: 5px
    min-width: 0
    font-size: 0.76rem
    font-weight: 600
    opacity: 0.7

  &__send
    flex: 0 0 auto
    color: var(--q-primary)
    font-weight: 700

.d-assistant-message
  display: flex
  margin-bottom: 10px
  min-width: 0
  overflow-x: hidden

  &--user
    justify-content: flex-end

    .d-assistant-message__content
      color: white
      background: var(--q-primary)

  &--assistant
    justify-content: flex-start

    .d-assistant-message__content
      background: rgba(255, 255, 255, 0.78)
      border: 1px solid rgba(15, 23, 42, 0.1)
      padding: 12px 14px !important

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

  &__thinking
    display: flex
    align-items: center
    gap: 9px
    color: inherit
    opacity: 0.78
    font-weight: 600

.d-assistant-sources-chip
  max-width: 100%
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
