<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from "vue-i18n"

import DPageTokens from './DPageTokens.vue'
import { pageValueI18nPath } from '../i18n/path'
import { buildPageAnchorTree } from './page-anchor-tree'
import { hasMathSupport, loadMathSupport, sourceHasMath, tokenizePageSectionSource } from './page-section-tokens'
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
const { t, locale } = useI18n()

const source = computed(() => {
  const absolute = store.state.i18n.absolute

  return absolute ? t(pageValueI18nPath(absolute, 'source')) : ''
})

// ? Math (katex) loads on demand: render the page right away and re-tokenize
//   once the engine arrives — pages without math never download it
const mathReady = ref(hasMathSupport())
watch(source, (value) => {
  if (!mathReady.value && sourceHasMath(value)) {
    loadMathSupport().then(() => {
      mathReady.value = hasMathSupport()
    })
  }
}, { immediate: true })

const tokenized = computed(() => {
  if (source.value === '') {
    return []
  }

  // Re-tokenize when math support finishes loading
  void mathReady.value

  const tokens = tokenizePageSectionSource(source.value, {
    codeToolbarDefault: props.codeToolbarDefault
  })

  if (Array.isArray(props.template?.sections) && props.template.sections.length > 0) {
    return applyTemplateSections(tokens, props.template, locale.value, {
      highlightColumn: docsectorConfig?.branding?.name,
      highlightRow: docsectorConfig?.branding?.name
    })
  }

  return tokens
})

watch(tokenized, (tokens) => {
  store.commit('page/setAnchorTree', buildPageAnchorTree(tokens))
}, { immediate: true })

// # Progressive reveal
// ! Enough blocks to overfill the tallest first viewport — the deferred tail
//   mounts strictly below the fold, so LCP candidates and CLS are untouched
const INITIAL_BLOCKS = 24
// ! Small enough that each idle batch mounts in well under 50ms (no TBT)
const REVEAL_BATCH = 16

const visibleCount = ref(props.progressive ? INITIAL_BLOCKS : Infinity)

const visibleTokens = computed(() => {
  const tokens = tokenized.value

  return visibleCount.value >= tokens.length
    ? tokens
    : tokens.slice(0, visibleCount.value)
})

// @@ Append one batch per idle period until the page is complete
function reveal () {
  if (visibleCount.value >= tokenized.value.length) {
    return
  }

  const idle = typeof window.requestIdleCallback === 'function'
    ? (callback) => window.requestIdleCallback(callback, { timeout: 200 })
    : (callback) => window.setTimeout(callback, 48)

  idle(() => {
    visibleCount.value += REVEAL_BATCH
    reveal()
  })
}

onMounted(() => {
  if (!props.progressive) {
    return
  }

  // ? Deep links need their target block in the DOM right away
  if (window.location.hash) {
    visibleCount.value = Infinity
    return
  }

  reveal()
})
</script>

<template>
<section>
  <d-page-tokens
    :id="id"
    :render-primary-heading="renderPrimaryHeading"
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
