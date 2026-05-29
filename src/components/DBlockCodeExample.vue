<script setup>
import { computed, markRaw, ref, watch } from 'vue'
import { openURL, Quasar, useQuasar } from 'quasar'

import { resolveCodeExample } from 'virtual:docsector-code-examples'
import docsectorConfig from 'docsector.config.js'

import DBlockSourceCode from './DBlockSourceCode.vue'
import {
  canCreateCodepenPayload,
  createCodeExampleGitHubUrl,
  createCodeExampleTabs,
  createCodepenPayload,
  getCodepenUnsupportedReason
} from './code-example-source'

defineOptions({
  name: 'DBlockCodeExample'
})

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  src: {
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
  },
  expanded: {
    type: Boolean,
    default: false
  },
  codepen: {
    type: Boolean,
    default: true
  },
  scrollable: {
    type: Boolean,
    default: false
  },
  overflow: {
    type: Boolean,
    default: false
  },
  height: {
    type: String,
    default: ''
  }
})

const $q = useQuasar()

const isBusy = ref(false)
const errorMessage = ref('')
const component = ref(null)
const sourceText = ref('')
const sourceTabs = ref([])
const sourceOpen = ref(props.expanded)
const exampleFilePath = ref('')
let requestIndex = 0

const displayTitle = computed(() => props.title || props.src || 'Code example')
const frameTone = computed(() => $q.dark.isActive ? 'dark' : 'light')
const hasSource = computed(() => sourceText.value.trim().length > 0)
const codepenUnsupportedReason = computed(() => {
  if (!hasSource.value) {
    return 'Source code is still loading.'
  }

  return getCodepenUnsupportedReason(sourceText.value)
})
const canOpenCodepen = computed(() => props.codepen && hasSource.value && canCreateCodepenPayload(sourceText.value))
const codepenTooltip = computed(() => canOpenCodepen.value ? 'Edit in CodePen' : codepenUnsupportedReason.value)
const githubUrl = computed(() => createCodeExampleGitHubUrl(exampleFilePath.value, docsectorConfig))
const canOpenGitHub = computed(() => githubUrl.value !== '')
const previewStyle = computed(() => {
  const style = {}
  const normalizedHeight = normalizeCssLength(props.height)

  if (normalizedHeight) {
    style.height = normalizedHeight
  } else if (props.scrollable) {
    style.height = '500px'
  }

  return style
})

watch(() => props.expanded, (value) => {
  sourceOpen.value = value
})

watch(() => props.src, () => {
  loadExample()
}, { immediate: true })

function normalizeCssLength (value = '') {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return ''
  }

  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return `${normalized}px`
  }

  return normalized
}

async function loadExample () {
  const currentRequest = ++requestIndex
  const resolved = resolveCodeExample(props.src)

  isBusy.value = true
  errorMessage.value = ''
  component.value = null
  sourceText.value = ''
  sourceTabs.value = []
  exampleFilePath.value = ''

  if (!props.src) {
    errorMessage.value = 'Code example source is missing.'
    isBusy.value = false
    return
  }

  if (!resolved.exists || typeof resolved.loadComponent !== 'function' || typeof resolved.loadSource !== 'function') {
    errorMessage.value = `Code example not found: ${resolved.id || props.src}`
    isBusy.value = false
    return
  }

  try {
    const [componentModule, rawSource] = await Promise.all([
      resolved.loadComponent(),
      resolved.loadSource()
    ])

    if (currentRequest !== requestIndex) {
      return
    }

    component.value = markRaw(componentModule.default || componentModule)
    sourceText.value = String(rawSource || '')
    sourceTabs.value = createCodeExampleTabs(sourceText.value)
    exampleFilePath.value = resolved.filePath || ''
  } catch (err) {
    if (currentRequest !== requestIndex) {
      return
    }

    errorMessage.value = err?.message || `Unable to load code example: ${props.src}`
  } finally {
    if (currentRequest === requestIndex) {
      isBusy.value = false
    }
  }
}

function toggleSource () {
  sourceOpen.value = !sourceOpen.value
}

function submitCodepenPayload (payload) {
  if (typeof document === 'undefined') {
    return
  }

  const form = document.createElement('form')
  const input = document.createElement('input')

  form.method = 'post'
  form.action = 'https://codepen.io/pen/define/'
  form.target = '_blank'
  form.rel = 'noopener'
  form.style.display = 'none'

  input.type = 'hidden'
  input.name = 'data'
  input.value = JSON.stringify(payload)

  form.appendChild(input)
  document.body.appendChild(form)
  form.submit()
  form.remove()
}

function openCodepen () {
  if (!canOpenCodepen.value) {
    return
  }

  const sourceUrl = typeof window === 'undefined'
    ? ''
    : `${window.location.origin}${window.location.pathname}${window.location.hash}`

  submitCodepenPayload(createCodepenPayload(sourceText.value, {
    title: displayTitle.value,
    quasarVersion: Quasar.version,
    sourceUrl
  }))
}

function openGitHub () {
  if (canOpenGitHub.value) {
    openURL(githubUrl.value)
  }
}
</script>

<template>
<div
  class="d-block-code-example"
  :class="`d-block-code-example--${frameTone}`"
>
  <div class="d-block-code-example__toolbar">
    <div class="d-block-code-example__title">{{ displayTitle }}</div>

    <q-space />

    <q-btn
      class="d-block-code-example__button"
      dense
      flat
      round
      icon="fab fa-github"
      :disable="!canOpenGitHub"
      aria-label="View example on GitHub"
      @click="openGitHub"
    >
      <q-tooltip>{{ canOpenGitHub ? 'View on GitHub' : 'GitHub source is unavailable' }}</q-tooltip>
    </q-btn>

    <q-btn
      v-if="codepen"
      class="d-block-code-example__button"
      dense
      flat
      round
      icon="fab fa-codepen"
      :disable="!canOpenCodepen"
      aria-label="Edit in CodePen"
      @click="openCodepen"
    >
      <q-tooltip>{{ codepenTooltip }}</q-tooltip>
    </q-btn>

    <q-btn
      class="d-block-code-example__button"
      dense
      flat
      round
      icon="code"
      :disable="!hasSource"
      :aria-label="sourceOpen ? 'Hide source' : 'View source'"
      @click="toggleSource"
    >
      <q-tooltip>{{ sourceOpen ? 'Hide source' : 'View source' }}</q-tooltip>
    </q-btn>
  </div>

  <q-slide-transition>
    <div
      v-show="sourceOpen && hasSource"
      class="d-block-code-example__source"
    >
      <d-block-source-code
        :index="index"
        language="vue"
        :text="sourceText"
        :tabs="sourceTabs"
      />
    </div>
  </q-slide-transition>

  <q-linear-progress
    v-if="isBusy"
    color="primary"
    indeterminate
  />

  <div
    class="d-block-code-example__preview"
    :class="{
      'd-block-code-example__preview--scrollable': scrollable,
      'd-block-code-example__preview--overflow': overflow
    }"
    :style="previewStyle"
  >
    <component
      v-if="component && !errorMessage"
      :is="component"
      class="d-block-code-example__component"
    />

    <div
      v-else-if="errorMessage"
      class="d-block-code-example__fallback"
    >
      <q-icon
        name="warning"
        size="22px"
      />
      <span>{{ errorMessage }}</span>
    </div>
  </div>

  <div
    v-if="caption"
    class="d-block-code-example__caption"
    v-html="caption"
  ></div>
</div>
</template>

<style lang="sass">
body.body--light
  --d-code-example-bg: #ffffff
  --d-code-example-border: rgba(37, 67, 45, 0.16)
  --d-code-example-toolbar-bg: #f6f8f5
  --d-code-example-toolbar-text: #26352b
  --d-code-example-preview-bg: #ffffff
  --d-code-example-caption: #405148
  --d-code-example-muted: #5d7563

body.body--dark
  --d-code-example-bg: #111512
  --d-code-example-border: rgba(197, 220, 200, 0.18)
  --d-code-example-toolbar-bg: #1a211c
  --d-code-example-toolbar-text: #e8efe9
  --d-code-example-preview-bg: #0c0f0d
  --d-code-example-caption: #c7d4ca
  --d-code-example-muted: #9aafa0

.d-block-code-example
  background: var(--d-code-example-bg)
  border: 1px solid var(--d-code-example-border)
  border-radius: 6px
  box-shadow: 0 1px 1px rgb(0 0 0 / 8%)
  margin: 18px 0
  max-width: calc(100vw - 40px)
  overflow: hidden

  &__toolbar
    align-items: center
    background: var(--d-code-example-toolbar-bg)
    color: var(--d-code-example-toolbar-text)
    display: flex
    gap: 4px
    min-height: 42px
    min-width: 0
    padding: 4px 8px 4px 14px

  &__title
    font-size: 14px
    font-weight: 600
    line-height: 20px
    min-width: 0
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap

  &__button
    color: var(--d-code-example-muted)
    flex: 0 0 auto

  &__source
    border-top: 1px solid var(--d-code-example-border)

    .source-code
      box-shadow: none
      margin: 0
      max-width: 100%

      .source-code-frame
        border: 0
        border-radius: 0

  &__preview
    background: var(--d-code-example-preview-bg)
    min-height: 96px
    min-width: 0
    overflow: hidden
    position: relative

    &--scrollable
      overflow-y: auto

    &--overflow
      overflow: auto

  &__component
    display: block
    min-width: 0

  &__fallback
    align-items: center
    color: var(--d-code-example-muted)
    display: flex
    gap: 8px
    min-height: 96px
    padding: 18px

  &__caption
    border-top: 1px solid var(--d-code-example-border)
    color: var(--d-code-example-caption)
    font-size: 14px
    line-height: 1.55
    padding: 10px 14px 12px

    p
      margin: 0
</style>