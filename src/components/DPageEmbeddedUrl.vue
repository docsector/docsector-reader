<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { resolveEmbeddedUrl } from '../composables/useEmbeddedUrl'

defineOptions({
  name: 'DPageEmbeddedUrl'
})

const props = defineProps({
  url: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  }
})

const { t } = useI18n()

const resolved = computed(() => {
  return resolveEmbeddedUrl(props.url, {
    title: props.title
  })
})

const isEmbedded = computed(() => {
  return resolved.value.mode === 'embed' && resolved.value.embedSrc !== ''
})

const isCompactEmbed = computed(() => {
  return isEmbedded.value && resolved.value.provider === 'spotify'
})

const displayTitle = computed(() => {
  return resolved.value.title || props.title || resolved.value.providerLabel || props.url
})

const displayUrl = computed(() => {
  return resolved.value.displayUrl || props.url
})

const compactUrl = computed(() => {
  return String(displayUrl.value || '').replace(/^https?:\/\//i, '')
})

const frameStyle = computed(() => {
  const style = {}

  if (resolved.value.aspectRatio) {
    style.aspectRatio = resolved.value.aspectRatio
  } else {
    style.aspectRatio = 'auto'
  }

  if (resolved.value.frameHeight > 0) {
    style.height = `${resolved.value.frameHeight}px`
    style.minHeight = `${resolved.value.frameHeight}px`
  }

  return style
})

const openHref = computed(() => {
  return resolved.value.canonicalUrl || props.url
})
</script>

<template>
<div
  class="d-page-embedded-url"
  :class="{
    'd-page-embedded-url--compact': isCompactEmbed,
    'd-page-embedded-url--embedded': isEmbedded,
    'd-page-embedded-url--fallback': !isEmbedded
  }"
>
  <div
    v-if="isEmbedded"
    class="d-page-embedded-url__frame-shell"
    :style="frameStyle"
  >
    <iframe
      class="d-page-embedded-url__frame"
      :src="resolved.embedSrc"
      :title="displayTitle"
      :allow="resolved.allow || undefined"
      :allowfullscreen="resolved.allowFullscreen"
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>

  <div
    v-if="!isCompactEmbed || caption"
    class="d-page-embedded-url__body"
  >
    <template v-if="!isCompactEmbed">
    <div
      v-if="!isEmbedded"
      class="d-page-embedded-url__media"
      aria-hidden="true"
    >
      <q-icon
        :name="resolved.icon || 'link'"
        size="28px"
      />
    </div>

    <div class="d-page-embedded-url__content">
      <div
        v-if="resolved.providerLabel"
        class="d-page-embedded-url__provider"
      >
        <q-icon
          :name="resolved.icon || 'link'"
          size="16px"
        />
        <span>{{ resolved.providerLabel }}</span>
      </div>

      <div class="d-page-embedded-url__title">{{ displayTitle }}</div>

      <div
        v-if="compactUrl"
        class="d-page-embedded-url__url"
      >{{ compactUrl }}</div>

      <div
        v-if="caption"
        class="d-page-embedded-url__caption"
        v-html="caption"
      ></div>
    </div>

    <div class="d-page-embedded-url__actions">
      <q-btn
        no-caps
        unelevated
        padding="8px 12px"
        class="d-page-embedded-url__action-button"
        icon="open_in_new"
        :label="t('page.file.open')"
        :href="openHref"
        target="_blank"
        rel="noopener noreferrer"
      />
    </div>
    </template>

    <div
      v-else-if="caption"
      class="d-page-embedded-url__compact-caption"
      v-html="caption"
    ></div>
  </div>
</div>
</template>

<style lang="sass">
body.body--light
  --d-page-embedded-url-bg: linear-gradient(180deg, #f7faf5 0%, #ffffff 100%)
  --d-page-embedded-url-border: rgba(52, 85, 54, 0.14)
  --d-page-embedded-url-shadow: rgba(52, 85, 54, 0.08)
  --d-page-embedded-url-frame-bg: rgba(44, 60, 45, 0.04)
  --d-page-embedded-url-media-bg: rgba(255, 255, 255, 0.92)
  --d-page-embedded-url-media-border: rgba(52, 85, 54, 0.08)
  --d-page-embedded-url-accent: #30583a
  --d-page-embedded-url-meta: #56715c
  --d-page-embedded-url-caption: #405148
  --d-page-embedded-url-action-border: rgba(52, 85, 54, 0.18)
  --d-page-embedded-url-action-hover: rgba(52, 85, 54, 0.06)

body.body--dark
  --d-page-embedded-url-bg: linear-gradient(180deg, rgba(226, 255, 234, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)
  --d-page-embedded-url-border: rgba(214, 245, 224, 0.14)
  --d-page-embedded-url-shadow: rgba(0, 0, 0, 0.3)
  --d-page-embedded-url-frame-bg: rgba(255, 255, 255, 0.03)
  --d-page-embedded-url-media-bg: rgba(255, 255, 255, 0.06)
  --d-page-embedded-url-media-border: rgba(255, 255, 255, 0.1)
  --d-page-embedded-url-accent: #b9e2c5
  --d-page-embedded-url-meta: rgba(255, 255, 255, 0.72)
  --d-page-embedded-url-caption: rgba(255, 255, 255, 0.9)
  --d-page-embedded-url-action-border: rgba(214, 245, 224, 0.16)
  --d-page-embedded-url-action-hover: rgba(214, 245, 224, 0.08)

.d-page-embedded-url
  margin: 1.5rem 0
  border: 1px solid var(--d-page-embedded-url-border)
  border-radius: 18px
  background: var(--d-page-embedded-url-bg)
  box-shadow: 0 16px 36px var(--d-page-embedded-url-shadow)
  overflow: hidden

.d-page-embedded-url__frame-shell
  position: relative
  width: 100%
  min-height: 240px
  aspect-ratio: 16 / 9
  background: var(--d-page-embedded-url-frame-bg)
  border-bottom: 1px solid var(--d-page-embedded-url-border)

.d-page-embedded-url__frame
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  border: 0
  background: transparent

.d-page-embedded-url__body
  display: flex
  align-items: center
  gap: 1rem
  padding: 0.95rem 1rem

.d-page-embedded-url--embedded
  .d-page-embedded-url__body
    padding-top: 1.25rem

  .d-page-embedded-url__content
    padding-top: 0.1rem

.d-page-embedded-url--compact
  border: 0
  border-radius: 0
  background: transparent
  box-shadow: none
  overflow: visible

  .d-page-embedded-url__frame-shell
    border: 0
    background: transparent

  .d-page-embedded-url__body
    display: block
    padding: 0.6rem 0 0

.d-page-embedded-url__compact-caption
  margin-top: 0.65rem
  color: var(--d-page-embedded-url-caption)

  > :first-child
    margin-top: 0

  > :last-child
    margin-bottom: 0

.d-page-embedded-url__media
  width: 56px
  height: 56px
  flex: 0 0 56px
  display: flex
  align-items: center
  justify-content: center
  border-radius: 16px
  background: var(--d-page-embedded-url-media-bg)
  box-shadow: inset 0 0 0 1px var(--d-page-embedded-url-media-border)
  color: var(--d-page-embedded-url-accent)

.d-page-embedded-url__content
  min-width: 0
  flex: 1 1 auto

.d-page-embedded-url__provider
  display: inline-flex
  align-items: center
  gap: 0.35rem
  margin-bottom: 0.35rem
  color: var(--d-page-embedded-url-meta)
  font-size: 0.82rem
  font-weight: 700
  line-height: 1
  text-transform: uppercase
  letter-spacing: 0.06em

.d-page-embedded-url__title
  font-size: 1rem
  font-weight: 700
  line-height: 1.4
  word-break: break-word

.d-page-embedded-url__url
  margin-top: 0.2rem
  color: var(--d-page-embedded-url-meta)
  font-size: 0.84rem
  line-height: 1.35
  word-break: break-all

.d-page-embedded-url__caption
  margin-top: 0.45rem
  color: var(--d-page-embedded-url-caption)

  > :first-child
    margin-top: 0

  > :last-child
    margin-bottom: 0

.d-page-embedded-url__actions
  flex: 0 0 auto
  display: flex
  align-items: center
  align-self: stretch

.d-page-embedded-url__action-button
  min-height: 40px
  border-radius: 10px
  border: 1px solid var(--d-page-embedded-url-action-border)
  background: transparent !important
  color: var(--d-page-embedded-url-accent) !important
  transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease

  .q-btn__content
    gap: 0.45rem
    font-size: 0.9rem
    font-weight: 600
    line-height: 1

  .q-focus-helper,
  &:before,
  &:after
    display: none

  &:hover
    transform: translateY(-1px)
    background: var(--d-page-embedded-url-action-hover) !important

  &:focus-visible
    outline: 2px solid var(--d-page-embedded-url-accent)
    outline-offset: 2px

.d-page-embedded-url--fallback
  .d-page-embedded-url__body
    padding-block: 1.05rem

@media (max-width: 720px)
  .d-page-embedded-url__frame-shell
    min-height: 200px

  .d-page-embedded-url__body
    flex-wrap: wrap
    align-items: flex-start

  .d-page-embedded-url__actions
    width: 100%
    justify-content: flex-start

  .d-page-embedded-url__action-button
    width: 100%
    justify-content: center

@media (max-width: 520px)
  .d-page-embedded-url__body
    gap: 0.85rem
    padding: 0.9rem

  .d-page-embedded-url__media
    width: 48px
    height: 48px
    flex-basis: 48px

  .d-page-embedded-url__provider
    font-size: 0.76rem

  .d-page-embedded-url__title
    font-size: 0.95rem
</style>