<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import useNavigator from '../composables/useNavigator'

import DPageAnchor from './DPageAnchor.vue'
import DPageMeta from './DPageMeta.vue'

const store = useStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const { scrolling, navigate } = useNavigator()

const props = defineProps({
  disableNav: {
    type: Boolean,
    default: false
  }
})

const pageScrollArea = ref(null)

const overview = computed(() => route.matched[0].path)
const showcase = computed(() => {
  const showcase = route.matched[0].meta.subpages.showcase
  return showcase ? overview.value + '/showcase' : false
})
const vs = computed(() => {
  const vs = route.matched[0].meta.subpages.vs
  return vs ? overview.value + '/vs' : false
})
const layoutMeta = computed({
  get: () => store.state.layout.meta,
  set: (value) => store.commit('layout/setMeta', value)
})
const main = computed(() => {
  switch (store.state.page.relative) {
    case '/showcase':
      return 'showcase'
    case '/vs':
      return 'vs'
    default:
      return 'overview'
  }
})

const toggleSectionsTree = () => {
  layoutMeta.value = !layoutMeta.value
}

const pActive = (relative) => {
  if (relative === '/' && (store.state.page.relative === relative || store.state.page.relative === '')) {
    return 'active'
  } else if (store.state.page.relative === relative) {
    return 'active'
  }
  return null
}

const subroute = (to) => {
  const base = '/' + store.state.page.base
  const relative = store.state.page.relative
  let path = base

  if (to !== '/') {
    path += to
  }

  if (relative === to) {
    if (to !== '/showcase') {
      return router.push({ hash: '#0' })
    } else {
      return router.push({ hash: '#1' })
    }
  }

  router.push(path)
  return true
}

const resetPageScroll = () => {
  if (pageScrollArea.value !== null) {
    pageScrollArea.value.setScrollPosition('vertical', 0, 0)
  }
}

onMounted(() => {
  router.beforeEach((to, from, next) => {
    resetPageScroll()

    if (to.hash === '' && from.path !== to.path) {
      store.commit('page/resetAnchor')
      store.commit('page/resetAnchors')
      store.commit('page/resetNodes')
    }

    next()
  })
})
</script>

<template>
<q-page-container id="page-container">
  <q-toolbar id="submenu" class="bg-grey-8 text-white">
    <q-toolbar-title class="toolbar-container">
      <q-btn-group :class="$q.screen.lt.md ? 'mobile' : null">
        <q-btn
          v-if="overview && (showcase || vs)"
          no-caps flat
          :class="pActive('/overview')"
          :label="$t('submenu.overview')" icon="pageview"
          @click="subroute('/overview')"
        />
        <q-btn
          v-if="showcase"
          no-caps flat
          :class="pActive('/showcase')"
          :label="$t('submenu.showcase')" icon="play_circle_filled"
          @click="subroute('/showcase')"
        />
        <q-btn
          v-if="vs"
          no-caps flat
          :class="pActive('/vs')"
          :label="$t('submenu.versus')" icon="compare"
          @click="subroute('/vs')"
        />
      </q-btn-group>
    </q-toolbar-title>
    <q-btn @click="toggleSectionsTree" icon="account_tree" />
  </q-toolbar>

  <q-page id="page">
    <q-scroll-area class="content" :class="main" ref="pageScrollArea">
      <div id="scroll-container">
        <slot />
      </div>
      <d-page-meta v-if="!disableNav" />
      <q-scroll-observer @scroll="scrolling" :debounce="300" />
    </q-scroll-area>
  </q-page>

  <q-drawer elevated show-if-above side="right" v-model="layoutMeta">
    <d-page-anchor id="anchor" />
  </q-drawer>
</q-page-container>
</template>

<style lang="sass">
#page-container
  padding-bottom: 0 !important

.content,
.content > div.scroll
  min-height: calc(100vh - 86px)

.content:not(.no-padding) > div.scroll > div.q-scrollarea__content
  padding: 15px

#page
  min-height: calc(100vh - 86px) !important

#scroll-container
  max-width: 1200px
  margin: auto

#submenu
  min-height: 36px
  padding: 0
  box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px rgba(0,0,0,0.14), 0 1px 6px rgba(0,0,0,0.12)
  overflow: visible

  .on-left
    margin-right: 5px
  .toolbar-container
    overflow: visible
  .q-btn-group
    box-shadow: none
    &.mobile
      .q-btn-inner
        div
          display: none
  .q-btn-inner
    .q-icon
      margin: 0
    div
      &:not(.focus-helper)
        margin-left: 6px

#submenu a,
#submenu button
  border-radius: 0
  padding: 6px 12px

// * Coloring
// Light
body.body--light
  #submenu a.active,
  #submenu button.active
    background-color: #fff !important
    color: #000
    box-shadow: 0 10px 0 0 #fff
// Dark
body.body--dark
  #submenu a.active,
  #submenu button.active
    background-color: var(--q-dark-page) !important
    color: #fff
    box-shadow: 0 10px 0 0 var(--q-dark-page)

body.mobile.body--dark
  .q-drawer--right
    background: rgba(18, 0, 0, 0.7)
body.mobile
  .q-drawer--right
    background: rgba(255, 255, 255, 0.7)
</style>
