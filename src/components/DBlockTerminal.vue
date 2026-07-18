<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { openURL, useQuasar } from 'quasar'
import { fabGithub } from '@quasar/extras/fontawesome-v5'

import { resolveTerminalEngine } from 'virtual:docsector-terminals'

import { useSsrSafeDark } from '../composables/useSsrSafeDark'

import DBlockSourceCode from './DBlockSourceCode.vue'

defineOptions({
  name: 'DBlockTerminal'
})

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  engine: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  command: {
    type: String,
    default: ''
  },
  commands: {
    type: Array,
    default: () => []
  },
  height: {
    type: String,
    default: ''
  },
  autorun: {
    type: Boolean,
    default: false
  },
  runLabel: {
    type: String,
    default: ''
  },
  minColumns: {
    type: [String, Number],
    default: 80
  }
})

const $q = useQuasar()

const STATUS_COPY = {
  downloading: 'Downloading runtime…',
  extracting: 'Preparing filesystem…',
  booting: 'Booting…',
  running: 'Running…'
}

const TERMINAL_THEME = {
  background: '#0c0f0d',
  foreground: '#e8efe9',
  cursor: '#e8efe9',
  cursorAccent: '#0c0f0d',
  selectionBackground: 'rgba(197, 220, 200, 0.3)',
  // ANSI "bright black" (SGR 90): xterm's default is too dim on this
  // background — timestamps, footers and muted labels become unreadable
  brightBlack: '#a8b5ab'
}

const state = ref('idle') // idle → loading → running → done | error
const statusDetail = ref('')
const errorMessage = ref('')
const engineReady = ref(false)
const terminalFocused = ref(false)
const isNarrow = ref(false)
const engineMeta = ref({})
const selectedCommand = ref(props.command || (props.commands[0]?.command ?? ''))
const sourceOpen = ref(false)
const sourceBusy = ref(false)
const sourceData = ref(null)
const viewportRef = ref(null)
const rootRef = ref(null)

let term = null
let fitAddon = null
let engineInstance = null
let enginePromise = null
let resizeObserver = null
let intersectionObserver = null

// ? SSR-safe: hydration must render the serialized (light) tone first — see useSsrSafeDark
const darkActive = useSsrSafeDark()
const frameTone = computed(() => darkActive.value ? 'dark' : 'light')
const minimumColumns = computed(() => {
  const parsed = parseInt(props.minColumns, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 80
})
const displayTitle = computed(() => props.title || engineMeta.value.label || props.engine)
const runButtonLabel = computed(() => {
  if (state.value === 'done' || state.value === 'error') {
    return props.runLabel || 'Replay'
  }

  return props.runLabel || 'Run'
})
const isBusy = computed(() => state.value === 'loading' || state.value === 'running')
const canStop = computed(() => engineReady.value && typeof engineInstance?.stop === 'function')
const canInput = computed(() => engineReady.value && typeof engineInstance?.input === 'function')
const showInteractHint = computed(() => state.value === 'running' && canInput.value && !terminalFocused.value)
const statusLabel = computed(() => {
  if (state.value === 'error') {
    return 'Error'
  }
  if (state.value === 'running') {
    return statusDetail.value || STATUS_COPY.running
  }
  if (state.value === 'loading') {
    return statusDetail.value || 'Loading…'
  }
  if (state.value === 'done') {
    return 'Finished'
  }

  return ''
})
const commandOptions = computed(() => props.commands.map((entry) => ({
  label: entry.label,
  value: entry.command
})))
const hasSourceView = computed(() => engineReady.value && typeof engineInstance?.source === 'function')
const sourceUrl = computed(() => sourceData.value?.url || '')
const viewportStyle = computed(() => {
  const normalized = String(props.height || '').trim()

  if (!normalized) {
    return { height: '360px' }
  }

  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return { height: `${normalized}px` }
  }

  return { height: normalized }
})

function onOutput (chunk) {
  if (term && chunk !== undefined && chunk !== null) {
    term.write(chunk)
  }
}

function onError (chunk) {
  onOutput(chunk)
}

function onStatus (phase, detail = '') {
  statusDetail.value = detail || STATUS_COPY[phase] || ''
}

// Keyboard and mouse data from xterm (mouse arrives as SGR escape sequences
// once the guest application enables tracking). The terminal only captures
// the keyboard after a click inside it (click-to-focus). Ctrl+C is forwarded
// as a raw byte (\x03) like any other key: the guest program owns interrupt
// semantics (double-press confirmations, graceful restore); a runaway guest
// is killed with the Stop button.
function forwardInput (data) {
  if (state.value !== 'running' || !canInput.value) {
    return
  }

  try {
    engineInstance.input(data)
  } catch (err) {
    // input must never surface as a block error
  }
}

// Engine factories are cheap by contract (heavy work happens inside run()),
// so the engine loads at mount: source view and Stop are available before
// the first run, while xterm and the runtime stay lazy.
function ensureEngine () {
  if (!enginePromise) {
    enginePromise = (async () => {
      const resolved = resolveTerminalEngine(props.engine)
      if (!resolved.exists || typeof resolved.loadEngine !== 'function') {
        throw new Error(`Terminal engine not found: ${resolved.id || props.engine}`)
      }

      const engineModule = await resolved.loadEngine()
      engineMeta.value = engineModule.meta || {}

      const createEngine = engineModule.default
      if (typeof createEngine !== 'function') {
        throw new Error(`Terminal engine has no factory export: ${resolved.id}`)
      }

      engineInstance = await createEngine({ onOutput, onError, onStatus })
      engineReady.value = true

      return engineInstance
    })().catch((err) => {
      enginePromise = null
      throw err
    })
  }

  return enginePromise
}

async function ensureTerminal () {
  if (term) {
    return
  }

  const [{ Terminal }, { FitAddon }] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit'),
    import('@xterm/xterm/css/xterm.css')
  ])

  term = new Terminal({
    convertEol: true,
    cursorBlink: canInput.value,
    disableStdin: !canInput.value,
    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Menlo, monospace',
    fontSize: 13,
    scrollback: 2000,
    theme: TERMINAL_THEME
  })
  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(viewportRef.value)
  fit()

  term.onData(forwardInput)
  term.onBinary(forwardInput)
  term.textarea?.addEventListener('focus', () => { terminalFocused.value = true })
  term.textarea?.addEventListener('blur', () => { terminalFocused.value = false })

  resizeObserver = new ResizeObserver(() => {
    try {
      fit()
    } catch (err) {
      // ignore transient layout races during unmount
    }
  })
  resizeObserver.observe(viewportRef.value)
}

// FitAddon.fit() clamped to a column floor: TUI demos are authored for a
// minimum terminal width, and narrow (mobile) containers would otherwise
// wrap every box-drawing row into visual garbage. Below the floor the
// terminal keeps `minColumns` and the screen pans horizontally instead
// (isNarrow drives the scroll hint pill).
function fit () {
  if (!term || !fitAddon) {
    return
  }

  const proposed = fitAddon.proposeDimensions()
  if (!proposed || !Number.isFinite(proposed.cols) || !Number.isFinite(proposed.rows)) {
    return
  }

  const columns = Math.max(minimumColumns.value, proposed.cols)
  const rows = Math.max(2, proposed.rows)

  isNarrow.value = proposed.cols < minimumColumns.value

  if (term.cols !== columns || term.rows !== rows) {
    term.resize(columns, rows)
  }
}

async function run () {
  if (isBusy.value) {
    return
  }

  state.value = 'loading'
  statusDetail.value = ''
  errorMessage.value = ''

  try {
    await ensureEngine()
    await ensureTerminal()
  } catch (err) {
    errorMessage.value = err?.message || `Unable to load terminal engine: ${props.engine}`
    state.value = 'error'
    return
  }

  state.value = 'running'
  term.reset()

  try {
    await engineInstance.run(selectedCommand.value, {
      columns: term.cols,
      rows: term.rows
    })
    state.value = 'done'
  } catch (err) {
    errorMessage.value = err?.message || 'The command failed.'
    state.value = 'error'
  }
}

async function stop () {
  if (state.value !== 'running' || !canStop.value) {
    return
  }

  try {
    await engineInstance.stop()
  } catch (err) {
    // stopping must never surface as a block error
  }
}

async function loadSource (command) {
  if (!hasSourceView.value) {
    return
  }

  sourceBusy.value = true
  try {
    sourceData.value = await engineInstance.source(command)
  } catch (err) {
    sourceData.value = null
  } finally {
    sourceBusy.value = false
  }
}

async function toggleSource () {
  sourceOpen.value = !sourceOpen.value

  if (sourceOpen.value && !sourceData.value) {
    await loadSource(selectedCommand.value)
  }
}

// Tabs are deep-linkable: the selected command persists as a ?t<ordinal> query
// param (one per terminal block on the page, in DOM order), so a reload or a
// shared link restores the same tab. Blocks mount in document order, so the
// ordinal computed at mount is stable across reloads.
let anchorParam = ''

function anchor () {
  if (!anchorParam && rootRef.value) {
    const ordinal = Array.from(document.querySelectorAll('.d-block-terminal')).indexOf(rootRef.value)
    anchorParam = `t${ordinal < 0 ? props.index : ordinal}`
  }

  return anchorParam
}

function syncAnchor (value) {
  if (typeof window === 'undefined' || !props.commands.length || !anchor()) {
    return
  }

  const url = new URL(window.location.href)
  const isDefault = value === (props.command || (props.commands[0]?.command ?? ''))

  if (isDefault) {
    url.searchParams.delete(anchor())
  } else {
    url.searchParams.set(anchor(), value)
  }

  window.history.replaceState(window.history.state, '', url)
}

function restoreAnchor () {
  if (typeof window === 'undefined' || !props.commands.length) {
    return
  }

  const anchored = anchor() && new URLSearchParams(window.location.search).get(anchor())
  if (!anchored || anchored === selectedCommand.value) {
    return
  }

  if (props.commands.some((entry) => entry.command === anchored)) {
    selectedCommand.value = anchored
    rootRef.value?.scrollIntoView({ block: 'center' })
  }
}

async function selectCommand (value) {
  if (value === selectedCommand.value || isBusy.value) {
    return
  }

  selectedCommand.value = value
  sourceData.value = null
  syncAnchor(value)

  if (sourceOpen.value) {
    await loadSource(value)
  }

  // The runtime is already warm after a first run — switching tab runs directly
  if (state.value === 'done' || state.value === 'error') {
    run()
  }
}

function openGitHub () {
  if (sourceUrl.value) {
    openURL(sourceUrl.value)
  }
}

onMounted(() => {
  restoreAnchor()

  ensureEngine().catch((err) => {
    errorMessage.value = err?.message || `Unable to load terminal engine: ${props.engine}`
    state.value = 'error'
  })

  if (!props.autorun || typeof IntersectionObserver === 'undefined') {
    return
  }

  intersectionObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      intersectionObserver.disconnect()
      intersectionObserver = null
      run()
    }
  }, { threshold: 0.25 })
  intersectionObserver.observe(rootRef.value)
})

onBeforeUnmount(() => {
  intersectionObserver?.disconnect()
  intersectionObserver = null
  resizeObserver?.disconnect()
  resizeObserver = null

  try {
    engineInstance?.dispose?.()
  } catch (err) {
    // engine teardown must never block unmount
  }
  engineInstance = null
  engineReady.value = false

  term?.dispose()
  term = null
  fitAddon = null
})
</script>

<template>
<div
  ref="rootRef"
  class="d-block-terminal"
  :class="`d-block-terminal--${frameTone}`"
>
  <div class="d-block-terminal__toolbar">
    <q-icon
      class="d-block-terminal__glyph"
      name="terminal"
      size="18px"
    />
    <div class="d-block-terminal__title">{{ displayTitle }}</div>

    <q-space />

    <div
      v-if="statusLabel"
      class="d-block-terminal__status"
      :class="`d-block-terminal__status--${state}`"
    >
      <q-spinner
        v-if="isBusy"
        size="12px"
      />
      <span>{{ statusLabel }}</span>
    </div>

    <q-btn
      v-if="hasSourceView"
      class="d-block-terminal__button"
      dense
      flat
      round
      :icon="fabGithub"
      :disable="!sourceUrl"
      aria-label="View source on GitHub"
      @click="openGitHub"
    >
      <q-tooltip>{{ sourceUrl ? 'View on GitHub' : 'Open the source view first' }}</q-tooltip>
    </q-btn>

    <q-btn
      v-if="hasSourceView"
      class="d-block-terminal__button"
      dense
      flat
      round
      icon="code"
      :aria-label="sourceOpen ? 'Hide source' : 'View source'"
      @click="toggleSource"
    >
      <q-tooltip>{{ sourceOpen ? 'Hide source' : 'View source' }}</q-tooltip>
    </q-btn>

    <q-btn
      v-if="state === 'running' && canStop"
      class="d-block-terminal__button d-block-terminal__button--stop"
      dense
      flat
      no-caps
      icon="stop"
      label="Stop"
      aria-label="Stop"
      @click="stop"
    />
    <q-btn
      v-else
      class="d-block-terminal__button d-block-terminal__button--run"
      dense
      flat
      no-caps
      :icon="state === 'done' || state === 'error' ? 'replay' : 'play_arrow'"
      :label="runButtonLabel"
      :disable="isBusy"
      :aria-label="runButtonLabel"
      @click="run"
    />
  </div>

  <q-tabs
    v-if="commandOptions.length > 1"
    class="d-block-terminal__tabs"
    dense
    no-caps
    align="left"
    outside-arrows
    mobile-arrows
    :model-value="selectedCommand"
    @update:model-value="selectCommand"
  >
    <q-tab
      v-for="option in commandOptions"
      :key="option.value"
      :name="option.value"
      :label="option.label"
      :disable="isBusy"
    />
  </q-tabs>

  <q-slide-transition>
    <div
      v-show="sourceOpen"
      class="d-block-terminal__source"
    >
      <q-linear-progress
        v-if="sourceBusy"
        color="primary"
        indeterminate
      />
      <d-block-source-code
        v-if="sourceData && sourceData.text"
        :index="index"
        :language="sourceData.language || engineMeta.language || 'text'"
        :text="sourceData.text"
      />
      <div
        v-else-if="!sourceBusy"
        class="d-block-terminal__source-empty"
      >
        Source is unavailable for this command.
      </div>
    </div>
  </q-slide-transition>

  <div
    class="d-block-terminal__viewport"
    :style="viewportStyle"
  >
    <div
      ref="viewportRef"
      class="d-block-terminal__screen"
    ></div>

    <div
      v-if="state === 'idle'"
      class="d-block-terminal__overlay"
    >
      <q-btn
        class="d-block-terminal__overlay-run"
        color="primary"
        no-caps
        rounded
        unelevated
        icon="play_arrow"
        :label="runButtonLabel"
        @click="run"
      />
      <div class="d-block-terminal__overlay-hint">
        Runs in your browser — the runtime is downloaded on first run.
      </div>
    </div>

    <div
      v-if="showInteractHint"
      class="d-block-terminal__interact"
    >
      <q-icon
        name="keyboard"
        size="14px"
      />
      <span>Click to interact</span>
    </div>

    <div
      v-if="isNarrow && state !== 'idle'"
      class="d-block-terminal__narrow"
    >
      <q-icon
        name="swap_horiz"
        size="14px"
      />
      <span>{{ minimumColumns }} columns — scroll sideways</span>
    </div>

    <div
      v-else-if="state === 'error' && errorMessage"
      class="d-block-terminal__overlay d-block-terminal__overlay--error"
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
    class="d-block-terminal__caption"
    v-html="caption"
  ></div>
</div>
</template>

<style lang="sass">
body.body--light
  --d-terminal-bg: #ffffff
  --d-terminal-border: rgba(37, 67, 45, 0.16)
  --d-terminal-button-bg: #edf3ee
  --d-terminal-button-border: rgba(37, 67, 45, 0.12)
  --d-terminal-button-hover-bg: #e2ebe4
  --d-terminal-toolbar-bg: #f6f8f5
  --d-terminal-toolbar-text: #26352b
  --d-terminal-caption: #405148
  --d-terminal-muted: #5d7563

body.body--dark
  --d-terminal-bg: #111512
  --d-terminal-border: rgba(197, 220, 200, 0.18)
  --d-terminal-button-bg: #29342d
  --d-terminal-button-border: rgba(197, 220, 200, 0.18)
  --d-terminal-button-hover-bg: #314036
  --d-terminal-toolbar-bg: #1a211c
  --d-terminal-toolbar-text: #e8efe9
  --d-terminal-caption: #c7d4ca
  --d-terminal-muted: #9aafa0

.d-block-terminal
  background: var(--d-terminal-bg)
  border: 1px solid var(--d-terminal-border)
  border-radius: 6px
  box-shadow: 0 1px 1px rgb(0 0 0 / 8%)
  margin: 18px 0
  max-width: calc(100vw - 40px)
  overflow: hidden

  &__toolbar
    align-items: center
    background: var(--d-terminal-toolbar-bg)
    color: var(--d-terminal-toolbar-text)
    display: flex
    gap: 6px
    min-height: 42px
    min-width: 0
    padding: 4px 8px 4px 14px

  &__glyph
    color: var(--d-terminal-muted)
    flex: 0 0 auto

  &__title
    font-size: 14px
    font-weight: 600
    line-height: 20px
    min-width: 0
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap

  &__status
    align-items: center
    color: var(--d-terminal-muted)
    display: flex
    font-size: 12px
    gap: 6px
    white-space: nowrap

    &--error
      color: #e05744

    &--done
      color: #43a047

  &__tabs
    background: var(--d-terminal-toolbar-bg)
    border-top: 1px solid var(--d-terminal-border)
    color: var(--d-terminal-muted)
    font-size: 13px

    .q-tab
      min-height: 34px
      padding: 0 12px

    .q-tab--active
      color: var(--d-terminal-toolbar-text)

    .q-tab__indicator
      background: currentColor

  &__button
    background: var(--d-terminal-button-bg)
    border: 1px solid var(--d-terminal-button-border)
    border-radius: 999px
    color: var(--d-terminal-muted)
    flex: 0 0 auto
    min-height: 30px
    min-width: 30px
    transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease

    &:hover,
    &:focus-visible
      background: var(--d-terminal-button-hover-bg)
      color: var(--d-terminal-toolbar-text)

    &.q-btn--disabled,
    &[disabled]
      opacity: 0.55

    &--run
      padding: 0 10px

    &--stop
      color: #e05744
      padding: 0 10px

  &__source
    border-bottom: 1px solid var(--d-terminal-border)
    border-top: 1px solid var(--d-terminal-border)

    .source-code
      box-shadow: none
      margin: 0
      max-width: 100%

      .source-code-frame
        border: 0
        border-radius: 0

  &__source-empty
    color: var(--d-terminal-muted)
    font-size: 13px
    padding: 14px

  &__viewport
    background: #0c0f0d
    min-width: 0
    overflow: hidden
    // Padding lives here, NOT on __screen: FitAddon sizes the terminal from
    // its parent's clientHeight, which includes the parent's own padding —
    // a padded __screen makes fit() propose more rows than actually fit and
    // the bottom row gets clipped
    padding: 8px 0 8px 12px
    position: relative
    transition: box-shadow 0.18s ease

    &:focus-within
      box-shadow: inset 0 0 0 2px rgba(118, 190, 126, 0.55)

    // xterm keeps `overflow-y: scroll` on its viewport: on classic-scrollbar
    // platforms (e.g. Windows) the default track renders as a white strip
    // over the dark terminal — theme it dark and thin instead
    .xterm-viewport
      scrollbar-color: rgba(197, 220, 200, 0.28) transparent
      scrollbar-width: thin

      &::-webkit-scrollbar
        height: 8px
        width: 8px

      &::-webkit-scrollbar-thumb
        background: rgba(197, 220, 200, 0.28)
        border-radius: 4px

      &::-webkit-scrollbar-track
        background: transparent

      &::-webkit-scrollbar-corner
        background: transparent

      &::-webkit-scrollbar-button
        display: none
        height: 0
        width: 0

  &__interact
    align-items: center
    background: rgba(12, 15, 13, 0.78)
    border: 1px solid rgba(197, 220, 200, 0.25)
    border-radius: 999px
    bottom: 10px
    color: #c7d4ca
    display: flex
    font-size: 12px
    gap: 6px
    padding: 4px 12px
    pointer-events: none
    position: absolute
    right: 12px

  &__narrow
    align-items: center
    background: rgba(12, 15, 13, 0.78)
    border: 1px solid rgba(197, 220, 200, 0.25)
    border-radius: 999px
    bottom: 10px
    color: #c7d4ca
    display: flex
    font-size: 12px
    gap: 6px
    left: 12px
    padding: 4px 12px
    pointer-events: none
    position: absolute

  &__screen
    height: 100%
    // Column floor (see fit()): when the container is narrower than the
    // terminal's minimum columns, the screen pans horizontally instead of
    // squeezing the terminal into wrapped box-drawing garbage
    overflow-x: auto
    scrollbar-color: rgba(197, 220, 200, 0.28) transparent
    scrollbar-width: thin
    width: 100%

    &::-webkit-scrollbar
      height: 8px

    &::-webkit-scrollbar-thumb
      background: rgba(197, 220, 200, 0.28)
      border-radius: 4px

    &::-webkit-scrollbar-track
      background: transparent

    .xterm
      height: 100%
      // Track the terminal's real pixel width so the horizontal overflow is
      // scrollable instead of clipped at the container edge
      min-width: 100%
      width: max-content

  &__overlay
    align-items: center
    background: rgba(12, 15, 13, 0.92)
    color: #e8efe9
    display: flex
    flex-direction: column
    gap: 10px
    inset: 0
    justify-content: center
    padding: 18px
    position: absolute
    text-align: center

    &--error
      flex-direction: row
      color: #ffb4a8
      font-size: 13px
      gap: 8px

  &__overlay-hint
    color: #9aafa0
    font-size: 12px

  &__caption
    border-top: 1px solid var(--d-terminal-border)
    color: var(--d-terminal-caption)
    font-size: 14px
    line-height: 1.55
    padding: 10px 14px 12px

    p
      margin: 0
</style>
