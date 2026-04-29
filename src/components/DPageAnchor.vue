<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from "vue-router";

import useNavigator from '../composables/useNavigator'
import { pageTitleI18nPath } from '../i18n/path'

const store = useStore()
const $q = useQuasar()
const route = useRoute()
const { t } = useI18n()
const { navigate, anchor, selected: navigatorSelected } = useNavigator()

const scrolling = ref(null)

const nodes = computed(() => store.getters['page/nodes'])
const expanded = computed({
  get() {
    return store.getters['page/nodesExpanded']
  },
  set(value) {
    // console.log(value)
  }
})
const selected = computed({
  get() {
    let anchor = store.state.page.anchor

    if (store.state.page.relative !== '' && anchor === 0) {
      anchor = anchor + 1
    }

    return anchor
  },
  set(value) {
    navigate(value)
  }
})

navigatorSelected.value = selected.value

const stylize = computed(() => {
  if ($q.platform.is.mobile && !$q.screen.lt.lg) {
    return 'fixed'
  } else {
    return 'q-ma-xs'
  }
})

const fallbackNodeLabel = computed(() => {
  const base = store.state.i18n.base
  if (!base) {
    return ''
  }

  return t(pageTitleI18nPath(base))
})

const scrollToActiveAnchor = () => {
  if (scrolling.value) {
    clearTimeout(scrolling.value)
  }

  scrolling.value = setTimeout(() => {
    const anchorEl = document.getElementById('anchor')
    if (anchorEl) {
      const activeNode = anchorEl.querySelector('.q-tree__node--selected')
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    scrolling.value = null
  }, 300)
}

watch(selected, () => {
  scrollToActiveAnchor()
})

onMounted(() => {
  store.commit('layout/setMetaToggle', true)

  setTimeout(() => {
    store.commit('page/setScrolling', true)
  }, 1000)

  const id = route.hash.replace(/^#+/g, '')
  if (id) {
    setTimeout(() => {
      anchor(id)
    }, 500)
  }
})

onBeforeUnmount(() => {
  if (scrolling.value) {
    clearTimeout(scrolling.value)
  }

  store.commit('layout/setMetaToggle', false)

  store.commit('page/resetAnchor')
  store.commit('page/resetAnchors')
  store.commit('page/resetNodes')

  store.commit('page/setScrolling', false)
})
</script>

<template>
<q-tree
  v-model:selected="selected"
  v-model:expanded="expanded"
  default-expand-all
  :class="stylize"
  :nodes="nodes"
  node-key="id"
>
  <template v-slot:default-header="props">
    <b v-if="props.node.label" v-html="props.node.label"></b>
    <b v-else>{{ fallbackNodeLabel }}</b>
  </template>
</q-tree>
</template>

<style lang="sass">
#anchor
  .q-tree
    padding-top: 12px
    width: 100%
  .q-tree-node-header
    margin: 0
    border-radius: 0
  b
    font-size: 15px

body.body--light
  #anchor
    b
      color: #1A496B

    .q-tree__node-header
      &.q-tree__node--selected
        background-color: var(--q-primary)

        b, i
          color: white !important
body.body--dark
  #anchor
    b
      color: #42B0FF

    .q-tree__node-header
      &.q-tree__node--selected
        background-color: var(--q-primary)

        b, i
          color: white !important
</style>
