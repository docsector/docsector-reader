<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
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
const pageContainer = ref(null)
const submenu = ref(null)
const pageMinHeight = ref('calc(100vh - 86px)')
const submenuHeight = ref('36px')
const pageBottomInset = ref('0px')

const updatePageMinHeight = () => {
  const pageContainerEl = pageContainer.value?.$el || pageContainer.value
  const submenuEl = submenu.value?.$el || submenu.value

  if (!pageContainerEl || !submenuEl) {
    return
  }

  const pageContainerStyles = window.getComputedStyle(pageContainerEl)
  const headerHeight = Number.parseFloat(pageContainerStyles.paddingTop) || 0
  const measuredSubmenuHeight = submenuEl.offsetHeight || 0
  const isMobile = $q.screen.lt.md
  const totalOffset = Math.max(0, Math.round(headerHeight + (isMobile ? 0 : measuredSubmenuHeight)))

  pageMinHeight.value = `calc(100vh - ${totalOffset}px)`
  submenuHeight.value = `${Math.max(36, Math.round(measuredSubmenuHeight))}px`
  pageBottomInset.value = isMobile ? submenuHeight.value : '0px'
}

const schedulePageMinHeightUpdate = () => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      updatePageMinHeight()
    })
  })
}

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
    path += to + '/'
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

const getPageScrollContainer = () => {
  return pageScrollArea.value?.$el?.querySelector('.q-scrollarea__container') || null
}

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

const handleMainScrollKeys = (event) => {
  const handledKeys = ['Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown']

  if (!handledKeys.includes(event.key)) {
    return
  }

  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
    return
  }

  if (isEditableTarget(event.target)) {
    return
  }

  const container = getPageScrollContainer()
  if (!container) {
    return
  }

  const currentTop = container.scrollTop
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight)
  const lineStep = Math.max(40, Math.floor(container.clientHeight * 0.08))
  const pageStep = Math.max(120, Math.floor(container.clientHeight * 0.9))

  let nextTop = currentTop
  switch (event.key) {
    case 'Home':
      nextTop = 0
      break
    case 'End':
      nextTop = maxTop
      break
    case 'PageUp':
      nextTop = Math.max(0, currentTop - pageStep)
      break
    case 'PageDown':
      nextTop = Math.min(maxTop, currentTop + pageStep)
      break
    case 'ArrowUp':
      nextTop = Math.max(0, currentTop - lineStep)
      break
    case 'ArrowDown':
      nextTop = Math.min(maxTop, currentTop + lineStep)
      break
  }

  event.preventDefault()

  if (pageScrollArea.value?.setScrollPosition) {
    pageScrollArea.value.setScrollPosition('vertical', nextTop, 0)
    return
  }

  container.scrollTop = nextTop
}

onMounted(() => {
  window.addEventListener('keydown', handleMainScrollKeys)
  window.addEventListener('resize', schedulePageMinHeightUpdate)
  nextTick(() => {
    schedulePageMinHeightUpdate()
  })

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

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleMainScrollKeys)
  window.removeEventListener('resize', schedulePageMinHeightUpdate)
})

watch(() => route.fullPath, () => {
  nextTick(() => {
    schedulePageMinHeightUpdate()
  })
})
</script>

<template>
<q-page-container
  id="page-container"
  ref="pageContainer"
  :style="{
    '--d-page-min-height': pageMinHeight,
    '--d-submenu-height': submenuHeight,
    '--d-page-bottom-inset': pageBottomInset
  }"
>
  <q-toolbar
    id="submenu"
    ref="submenu"
    class="bg-grey-8 text-white"
    :class="$q.screen.lt.md ? 'd-submenu--mobile' : 'd-submenu--desktop'"
  >
    <div class="d-submenu__content">
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
      <q-btn class="d-submenu__toggle" @click="toggleSectionsTree" icon="account_tree" />
    </div>
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
  min-height: var(--d-page-min-height, calc(100vh - 86px))

.content > div.scroll > div.q-scrollarea__content
  max-width: 100%
  box-sizing: border-box

.content:not(.no-padding) > div.scroll > div.q-scrollarea__content
  padding: 15px
  padding-bottom: calc(15px + var(--d-page-bottom-inset, 0px) + env(safe-area-inset-bottom, 0px))

#page
  min-height: var(--d-page-min-height, calc(100vh - 86px)) !important

#scroll-container
  width: 100%
  max-width: 1200px
  margin: auto

#submenu
  min-height: 36px
  padding: 0
  box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px rgba(0,0,0,0.14), 0 1px 6px rgba(0,0,0,0.12)
  overflow: visible

  .d-submenu__content
    width: calc(100% - 30px)
    max-width: 1200px
    min-height: inherit
    margin: 0 auto
    display: flex
    align-items: center
    align-self: stretch

  .d-submenu__toggle
    flex: 0 0 auto

  .on-left
    margin-right: 5px
  .toolbar-container
    overflow: visible
    padding: 0
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

#submenu.d-submenu--mobile
  position: fixed
  left: 0
  right: 0
  bottom: 0
  z-index: 1500
  min-height: 40px
  padding-bottom: env(safe-area-inset-bottom, 0px)
  box-shadow: 0 -1px 2px rgba(0,0,0,0.12), 0 -2px 6px rgba(0,0,0,0.08)

  .d-submenu__content
    align-items: flex-end

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

  #submenu.d-submenu--mobile a.active,
  #submenu.d-submenu--mobile button.active
    box-shadow: 0 -10px 0 0 #fff
// Dark
body.body--dark
  #submenu a.active,
  #submenu button.active
    background-color: var(--q-dark-page) !important
    color: #fff
    box-shadow: 0 10px 0 0 var(--q-dark-page)

  #submenu.d-submenu--mobile a.active,
  #submenu.d-submenu--mobile button.active
    box-shadow: 0 -10px 0 0 var(--q-dark-page)

body.mobile.body--dark
  .q-drawer--right
    background: rgba(18, 0, 0, 0.7)
body.mobile
  .q-drawer--right
    background: rgba(255, 255, 255, 0.7)
</style>
