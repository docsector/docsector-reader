<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

import useAssistant from '../composables/useAssistant'

const emit = defineEmits(['close'])

const props = defineProps({
  contextTitle: {
    type: String,
    default: ''
  },
  markdownUrl: {
    type: String,
    default: ''
  }
})

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
  <header class="d-assistant-panel__header">
    <div class="d-assistant-panel__brand">
      <q-icon name="auto_awesome" size="22px" />
      <strong>{{ title }}</strong>
    </div>
    <q-btn dense flat round icon="close" :aria-label="t('assistant.close')" @click="emit('close')">
      <q-tooltip>{{ t('assistant.close') }}</q-tooltip>
    </q-btn>
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
        v-for="message in assistant.messages.value"
        :key="message.id"
        class="d-assistant-message"
        :class="`d-assistant-message--${message.role}`"
      >
        <div class="d-assistant-message__content">{{ message.content }}</div>
      </div>
    </div>

    <div v-if="assistant.error.value" class="d-assistant-panel__error">
      <q-icon name="error_outline" />
      <span>{{ assistant.error.value }}</span>
    </div>

    <div v-if="assistant.sources.value.length > 0 && assistant.config.ui.showCitations" class="d-assistant-panel__sources">
      <div class="d-assistant-panel__sources-title">{{ t('assistant.sources') }}</div>
      <a
        v-for="source in assistant.sources.value"
        :key="source.id"
        class="d-assistant-source"
        :href="sourceHref(source)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <q-icon name="description" size="16px" />
        <span>{{ source.title }}</span>
      </a>
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

  &--dark
    background: #1b1b1c
    color: rgba(255, 255, 255, 0.86)

    .d-assistant-panel__composer
      background: linear-gradient(180deg, rgba(27,27,28,0), rgba(41, 24, 20, 0.72) 34%, #1b1b1c 100%)

    .d-assistant-message--assistant .d-assistant-message__content,
    .d-assistant-panel__prompt,
    .d-assistant-source
      background: rgba(255, 255, 255, 0.045)
      color: rgba(255, 255, 255, 0.86)
      border-color: rgba(255, 255, 255, 0.12)

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

  &__body
    flex: 1 1 auto
    min-height: 0

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
    padding: 16px 14px 96px

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
    margin: -76px 14px 96px
    display: flex
    flex-direction: column
    gap: 6px

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

  &__content
    max-width: 88%
    padding: 10px 12px
    border-radius: 8px
    white-space: pre-wrap
    overflow-wrap: anywhere
    line-height: 1.45

.d-assistant-source
  min-height: 34px
  display: flex
  align-items: center
  gap: 8px
  padding: 7px 10px
  border: 1px solid rgba(15, 23, 42, 0.12)
  border-radius: 8px
  color: inherit
  text-decoration: none
  background: rgba(255, 255, 255, 0.62)

  span
    min-width: 0
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
</style>
