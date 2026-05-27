<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import { resolveFileIconUrl } from '../composables/useFileIcon'

const BASE_URL = import.meta.env.BASE_URL || '/'

defineOptions({
  name: 'DPageFile'
})

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  }
})

const $q = useQuasar()
const { t } = useI18n()
const resolvedSize = ref(String(props.size || '').trim())

const isExternal = computed(() => /^https?:\/\//i.test(props.src || ''))
const resolvedHref = computed(() => {
  const raw = String(props.src || '').trim()

  if (!raw) {
    return ''
  }

  if (/^(?:[a-z]+:)?\/\//i.test(raw) || /^(?:mailto:|tel:|data:)/i.test(raw)) {
    return raw
  }

  const trimmedBase = String(BASE_URL).replace(/\/$/, '')

  if (raw.startsWith('/')) {
    return `${trimmedBase}${raw}` || raw
  }

  const normalized = raw.replace(/^\.\//, '')
  return `${trimmedBase}/${normalized}`.replace(/\/+/g, '/')
})
const absoluteHref = computed(() => {
  const href = resolvedHref.value

  if (!href || /^(?:[a-z]+:)?\/\//i.test(href)) {
    return href
  }

  if (typeof window === 'undefined') {
    return href
  }

  return new URL(href, window.location.origin).toString()
})
const fileName = computed(() => {
  const normalized = String(props.src || '')
    .split('#')[0]
    .split('?')[0]
  const rawSegment = normalized
    .split('/')
    .filter(Boolean)
    .pop() || ''

  if (!rawSegment) {
    return ''
  }

  try {
    return decodeURIComponent(rawSegment)
  } catch {
    return rawSegment
  }
})
const displayTitle = computed(() => {
  return props.title || fileName.value || t('page.file.defaultTitle')
})
const displayHeading = computed(() => {
  if (props.title && fileName.value && fileName.value !== props.title) {
    return `${props.title} (${fileName.value})`
  }

  return displayTitle.value
})
const iconUrl = computed(() => {
  return resolveFileIconUrl(fileName.value || displayTitle.value || props.src, {
    preferLight: !$q.dark.isActive
  })
})

const formatFileSize = (bytes) => {
  const value = Number(bytes)

  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  const maximumFractionDigits = size >= 100 || unitIndex === 0 ? 0 : (size >= 10 ? 1 : 2)
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(size)} ${units[unitIndex]}`
}

const readContentLength = async (href, options = {}) => {
  const response = await fetch(href, options)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentLength = response.headers.get('content-length') || response.headers.get('Content-Length')
  return formatFileSize(contentLength)
}

const hydrateSize = async () => {
  const manualSize = String(props.size || '').trim()
  resolvedSize.value = manualSize

  if (manualSize || !absoluteHref.value || typeof window === 'undefined') {
    return
  }

  try {
    const automaticSize = await readContentLength(absoluteHref.value, {
      method: 'HEAD'
    })

    if (automaticSize) {
      resolvedSize.value = automaticSize
      return
    }

    if (!isExternal.value) {
      const fallbackSize = await readContentLength(absoluteHref.value)
      if (fallbackSize) {
        resolvedSize.value = fallbackSize
      }
    }
  } catch {
    // External URLs may block access to Content-Length via CORS.
  }
}

watch([
  () => props.size,
  absoluteHref
], () => {
  hydrateSize()
}, {
  immediate: true
})

const openFile = () => {
  const href = absoluteHref.value

  if (!href || typeof window === 'undefined') {
    return
  }

  const link = document.createElement('a')

  link.href = href
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const downloadFile = async () => {
  const href = absoluteHref.value

  if (!href || typeof window === 'undefined') {
    return
  }

  if (isExternal.value) {
    openFile()
    return
  }

  try {
    const response = await fetch(href)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = fileName.value || displayTitle.value || 'download'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl)
    }, 1000)
  } catch {
    window.location.assign(href)
  }
}
</script>

<template>
<div class="d-page-file">
  <div class="d-page-file__body">
    <div class="d-page-file__media-column">
      <div class="d-page-file__media" aria-hidden="true">
        <img
          v-if="iconUrl"
          class="d-page-file__icon"
          :src="iconUrl"
          alt=""
          loading="lazy"
        />
        <q-icon
          v-else
          name="attach_file"
          size="30px"
        />
      </div>

      <div v-if="resolvedSize" class="d-page-file__size">{{ resolvedSize }}</div>
    </div>

    <div class="d-page-file__content">
      <div class="d-page-file__title">{{ displayHeading }}</div>

      <div
        v-if="caption"
        class="d-page-file__caption"
        v-html="caption"
      ></div>
    </div>

    <div class="d-page-file__actions">
      <q-btn
        no-caps
        unelevated
        padding="8px 12px"
        class="d-page-file__action-button d-page-file__action-button--primary"
        icon="download"
        :label="t('page.file.download')"
        @click="downloadFile"
      />

      <q-btn
        no-caps
        unelevated
        padding="8px 12px"
        class="d-page-file__action-button d-page-file__action-button--secondary"
        icon="open_in_new"
        :label="t('page.file.open')"
        @click="openFile"
      />
    </div>
  </div>
</div>
</template>

<style lang="sass">
body.body--light
  --d-page-file-bg: linear-gradient(180deg, #faf8f2 0%, #ffffff 100%)
  --d-page-file-border: rgba(101, 85, 41, 0.18)
  --d-page-file-shadow: rgba(101, 85, 41, 0.08)
  --d-page-file-media-bg: rgba(255, 255, 255, 0.82)
  --d-page-file-media-border: rgba(101, 85, 41, 0.1)
  --d-page-file-meta: #665f4f
  --d-page-file-caption: #4d5563
  --d-page-file-accent: #655529
  --d-page-file-action-text: #4d4020
  --d-page-file-action-border: rgba(101, 85, 41, 0.22)
  --d-page-file-action-bg-hover: rgba(101, 85, 41, 0.06)

body.body--dark
  --d-page-file-bg: linear-gradient(180deg, rgba(255, 248, 235, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)
  --d-page-file-border: rgba(255, 235, 194, 0.14)
  --d-page-file-shadow: rgba(0, 0, 0, 0.28)
  --d-page-file-media-bg: rgba(255, 255, 255, 0.94)
  --d-page-file-media-border: rgba(255, 255, 255, 0.18)
  --d-page-file-meta: rgba(255, 255, 255, 0.7)
  --d-page-file-caption: rgba(255, 255, 255, 0.9)
  --d-page-file-accent: #d7bc7e
  --d-page-file-action-text: rgba(255, 255, 255, 0.92)
  --d-page-file-action-border: rgba(255, 235, 194, 0.18)
  --d-page-file-action-bg-hover: rgba(255, 235, 194, 0.08)

.d-page-file
  margin: 1.5rem 0
  border: 1px solid var(--d-page-file-border)
  border-radius: 18px
  background: var(--d-page-file-bg)
  box-shadow: 0 16px 36px var(--d-page-file-shadow)
  overflow: hidden

.d-page-file__body
  display: flex
  align-items: center
  gap: 1rem
  padding: 0.82rem 0.92rem

.d-page-file__media-column
  display: flex
  flex: 0 0 68px
  flex-direction: column
  align-items: center
  gap: 0.16rem

.d-page-file__media
  width: 56px
  height: 56px
  display: flex
  align-items: center
  justify-content: center
  border-radius: 16px
  background: var(--d-page-file-media-bg)
  box-shadow: inset 0 0 0 1px var(--d-page-file-media-border)
  color: var(--d-page-file-accent)

.d-page-file__size
  width: 100%
  text-align: center
  color: var(--d-page-file-meta)
  font-size: 0.8rem
  font-weight: 700
  line-height: 1.05

.d-page-file__icon
  display: block
  width: 32px
  height: 32px

.d-page-file__content
  min-width: 0
  flex: 1 1 auto

.d-page-file__title
  font-size: 1rem
  font-weight: 700
  line-height: 1.4
  word-break: break-word

.d-page-file__caption
  margin-top: 0.35rem
  color: var(--d-page-file-caption)

  > :first-child
    margin-top: 0

  > :last-child
    margin-bottom: 0

.d-page-file__actions
  display: flex
  flex: 0 0 auto
  align-items: center
  gap: 0.6rem
  align-self: center

.d-page-file__action-button
  min-height: 40px
  border-radius: 10px
  border: 1px solid var(--d-page-file-action-border)
  background: transparent !important
  color: var(--d-page-file-action-text) !important
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
    background: var(--d-page-file-action-bg-hover) !important

  &:focus-visible
    outline: 2px solid var(--d-page-file-accent)
    outline-offset: 2px

.d-page-file__action-button--primary
  border-color: var(--d-page-file-action-border)

@media (max-width: 720px)
  .d-page-file__body
    flex-wrap: wrap
    align-items: flex-start

  .d-page-file__actions
    width: 100%

  .d-page-file__action-button
    flex: 1 1 0
</style>