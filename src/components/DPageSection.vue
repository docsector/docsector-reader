<script setup>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from "vue-i18n"

import DPageTokens from './DPageTokens.vue'
import { pageValueI18nPath } from '../i18n/path'
import { buildPageAnchorTree } from './page-anchor-tree'
import { tokenizePageSectionSource } from './page-section-tokens'
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
  template: {
    type: Object,
    default: null
  }
})

const store = useStore()
const { t, locale } = useI18n()

const tokenized = computed(() => {
  const absolute = store.state.i18n.absolute

  if (!absolute) {
    return []
  }

  const tokens = tokenizePageSectionSource(t(pageValueI18nPath(absolute, 'source')))

  if (Array.isArray(props.template?.sections) && props.template.sections.length > 0) {
    return applyTemplateSections(tokens, props.template, locale.value, {
      highlightColumn: docsectorConfig?.branding?.name
    })
  }

  return tokens
})

watch(tokenized, (tokens) => {
  store.commit('page/setAnchorTree', buildPageAnchorTree(tokens))
}, { immediate: true })
</script>

<template>
<section>
  <d-page-tokens
    :id="id"
    :render-primary-heading="renderPrimaryHeading"
    :tokens="tokenized"
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
