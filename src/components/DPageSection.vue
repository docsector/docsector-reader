<script setup>
import { computed, defineAsyncComponent, hydrateOnVisible, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from "vue-i18n"

import DPageTokens from './DPageTokens.vue'

// ? Lazy-hydrating twin of DPageTokens (same chunk — the loader resolves from
//   the module cache): SSR renders it fully, the client only hydrates it when
//   it scrolls near the viewport. Keeps the initial hydration task small.
const DPageTokensLazy = defineAsyncComponent({
  loader: () => import('./DPageTokens.vue'),
  hydrate: hydrateOnVisible({ rootMargin: '400px' })
})
import { pageValueI18nPath } from '../i18n/path'
import { buildPageAnchorTree } from './page-anchor-tree'
import { isCompiledPageSource, loadMathCss, parseCompiledPageTokens } from './page-tokens-support'
import { applyTemplateSections } from './page-template-sections'
import docsectorConfig from 'docsector.config.js'

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  renderPrimaryHeading: {
    type: Boolean,
    default: false
  },
  // Page-level default for the code block meta row (language + copy button):
  // true/false apply when a fence has no explicit :toolbar= attribute, null
  // keeps the content-derived behavior. `default: null` preserves the tri-state.
  codeToolbarDefault: {
    type: Boolean,
    default: null
  },
  template: {
    type: Object,
    default: null
  },
  // Mount the page in idle batches instead of one long task (used by the huge
  // remote README home): the first blocks render synchronously, the rest append
  // below the fold — anchors/ToC still index the full page (see anchor watch).
  progressive: {
    type: Boolean,
    default: false
  }
})

const store = useStore()
const { t, tm, locale } = useI18n()

// ? Build-compiled pages arrive as objects ({ v, tokens, ... }) — read them
//   raw via tm(); raw markdown strings (dev) keep t() so vue-i18n literal
//   escapes ({'@'}) are restored exactly as before
const source = computed(() => {
  const absolute = store.state.i18n.absolute
  if (!absolute) {
    return ''
  }

  const path = pageValueI18nPath(absolute, 'source')
  const raw = tm(path)

  return isCompiledPageSource(raw) ? raw : t(path)
})

// ! Tokenization result — sync for compiled sources; async (lazy tokenizer
//   chunk) for raw strings. shallowRef: token trees must not be deep-proxied.
const tokenized = shallowRef([])
let tokenizeGeneration = 0

watch(source, (value) => {
  const generation = ++tokenizeGeneration

  // ?: Compiled at build — parse and render; math pages only need the KaTeX CSS
  //    (their formula HTML was pre-rendered by the build)
  if (isCompiledPageSource(value)) {
    if (value.math) {
      loadMathCss()
    }
    tokenized.value = parseCompiledPageTokens(value)
    return
  }

  const text = typeof value === 'string' ? value : ''
  if (text === '') {
    tokenized.value = []
    return
  }

  // @ Raw string (dev / fallback): tokenize on the client via the lazy
  //   tokenizer chunk — markdown-it stays out of this component's graph
  import('./page-section-tokens').then((tokenizer) => {
    if (generation !== tokenizeGeneration) {
      return
    }

    tokenized.value = tokenizer.tokenizePageSectionSource(text, { codeToolbarDefault: null })

    // ? Math (katex) loads on demand: the page renders right away and
    //   re-tokenizes once the engine arrives (unchanged dev behavior)
    if (!tokenizer.hasMathSupport() && tokenizer.sourceHasMath(text)) {
      tokenizer.loadMathSupport().then(() => {
        if (generation !== tokenizeGeneration || !tokenizer.hasMathSupport()) {
          return
        }
        tokenized.value = tokenizer.tokenizePageSectionSource(text, { codeToolbarDefault: null })
      })
    }
  })
}, { immediate: true })

const sectionTokens = computed(() => {
  const tokens = tokenized.value

  if (Array.isArray(props.template?.sections) && props.template.sections.length > 0) {
    return applyTemplateSections(tokens, props.template, locale.value, {
      highlightColumn: docsectorConfig?.branding?.name,
      highlightRow: docsectorConfig?.branding?.name
    })
  }

  return tokens
})

watch(sectionTokens, (tokens) => {
  store.commit('page/setAnchorTree', buildPageAnchorTree(tokens))
}, { immediate: true })

// # Progressive reveal
// ! Enough blocks to overfill the tallest first viewport — the deferred tail
//   mounts strictly below the fold, so LCP candidates and CLS are untouched
const INITIAL_BLOCKS = 24
// ! Small enough that each idle batch mounts in well under 50ms (no TBT)
const REVEAL_BATCH = 16

// ? SSR renders the FULL page and the hydrating client must match it exactly —
//   the progressive gate only applies to plain SPA loads and later navigations
const suppressProgressive = typeof window === 'undefined' || window.__DOCSECTOR_HYDRATING__ === true

const visibleCount = ref(props.progressive && !suppressProgressive ? INITIAL_BLOCKS : Infinity)
// ! Generation guard: navigation restarts the reveal; stale loops must die
let revealGeneration = 0

const visibleTokens = computed(() => {
  const tokens = sectionTokens.value

  return visibleCount.value >= tokens.length
    ? tokens
    : tokens.slice(0, visibleCount.value)
})

// # Lazy hydration (SSR)
// ! Head blocks hydrate synchronously (they overfill the first viewport);
//   the below-the-fold tail hydrates per chunk as it scrolls into view —
//   server and hydrating client MUST produce this exact same structure
const HYDRATION_HEAD_BLOCKS = 24
const HYDRATION_CHUNK_BLOCKS = 30

const hydrationChunks = computed(() => {
  if (!suppressProgressive) {
    return null
  }

  const tokens = sectionTokens.value
  const head = tokens.slice(0, HYDRATION_HEAD_BLOCKS)
  const tail = []

  for (let offset = HYDRATION_HEAD_BLOCKS; offset < tokens.length; offset += HYDRATION_CHUNK_BLOCKS) {
    tail.push({
      offset,
      tokens: tokens.slice(offset, offset + HYDRATION_CHUNK_BLOCKS)
    })
  }

  return { head, tail }
})

// @@ Append one batch per idle period until the page is complete
function reveal (generation) {
  if (generation !== revealGeneration || visibleCount.value >= sectionTokens.value.length) {
    return
  }

  const idle = typeof window.requestIdleCallback === 'function'
    ? (callback) => window.requestIdleCallback(callback, { timeout: 200 })
    : (callback) => window.setTimeout(callback, 48)

  idle(() => {
    if (generation !== revealGeneration) {
      return
    }

    visibleCount.value += REVEAL_BATCH
    reveal(generation)
  })
}

function start () {
  if (!props.progressive) {
    return
  }

  revealGeneration++

  // ? Deep links need their target block in the DOM right away
  if (window.location.hash) {
    visibleCount.value = Infinity
    return
  }

  visibleCount.value = INITIAL_BLOCKS
  reveal(revealGeneration)
}

onMounted(() => {
  // ? Hydration/SSR first paint is already complete — no reveal to run
  if (!suppressProgressive) {
    start()
  }
})

// ? Client-side navigation reuses this component — restart the reveal for the
//   new page (the router scrolls back to the top, so the fold argument holds)
watch(source, () => {
  if (props.progressive) {
    start()
  }
})

onBeforeUnmount(() => {
  revealGeneration++
})
</script>

<template>
<section>
  <!-- SSR / hydration: head blocks hydrate now, tail chunks hydrate on view -->
  <template v-if="hydrationChunks">
    <d-page-tokens
      :id="id"
      :render-primary-heading="renderPrimaryHeading"
      :code-toolbar-default="codeToolbarDefault"
      :tokens="hydrationChunks.head"
    />
    <d-page-tokens-lazy
      v-for="chunk in hydrationChunks.tail"
      :key="chunk.offset"
      :id="id"
      :code-toolbar-default="codeToolbarDefault"
      :tokens="chunk.tokens"
    />
  </template>

  <!-- SPA / dev: classic progressive reveal -->
  <d-page-tokens
    v-else
    :id="id"
    :render-primary-heading="renderPrimaryHeading"
    :code-toolbar-default="codeToolbarDefault"
    :tokens="visibleTokens"
  />
</section>
</template>

<style lang="sass">
.content
  p
    line-height: 1.6em

    &.overview
      word-spacing: 0.05em
</style>
