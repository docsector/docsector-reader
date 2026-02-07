<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { useQuasar } from 'quasar'
import { useRoute } from "vue-router";

import useNavigator from 'src/composables/useNavigator'

const store = useStore()
const $q = useQuasar()
const route = useRoute()
const { navigate, anchor, selected: navigatorSelected } = useNavigator()

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
    <b v-if="props.node.label">{{ props.node.label }}</b>
    <b v-else>{{ $t(`_.${$store.state.i18n.base}._`) }}</b>
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
