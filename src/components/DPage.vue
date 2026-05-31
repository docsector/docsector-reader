<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import docsectorConfig from 'docsector.config.js'

import useNavigator from '../composables/useNavigator'
import { getReadingProgressState } from '../composables/useReadingProgress'
import { ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY } from '../composables/anchor-scroll-state'
import { normalizeAiAssistantConfig } from '../ai-assistant/config'
import { getAssistantRightRailState } from '../ai-assistant/layout'
import { resolveRoutePageLayout } from '../page-layout'

import DPageAnchor from './DPageAnchor.vue'
import DAssistantPanel from './DAssistantPanel.vue'
import DFooterOutlet from './DFooterOutlet.vue'
import DPageMeta from './DPageMeta.vue'

const store = useStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { locale } = useI18n()

const { scrolling, navigate, anchor: scrollToAnchor } = useNavigator()

const props = defineProps({
  disableNav: {
    type: Boolean,
    default: false
  },
  showBackToTopControl: {
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
const readingProgress = ref(getReadingProgressState())
const routeHashScrollTimeout = ref(null)
const assistantConfig = normalizeAiAssistantConfig(docsectorConfig)
const assistantEnabled = assistantConfig.enabled === true
const pageLayout = computed(() => resolveRoutePageLayout(route))
const showSubmenu = computed(() => pageLayout.value.submenu)
const showToc = computed(() => pageLayout.value.toc)
const showPageMeta = computed(() => !props.disableNav && pageLayout.value.footer)
const isFullwidthContent = computed(() => pageLayout.value.contentWidth === 'fullwidth')

const getPageScrollContainer = () => {
  return pageScrollArea.value?.$el?.querySelector('.q-scrollarea__container') || null
}

const syncReadingProgress = (scrollTop = null) => {
  const container = getPageScrollContainer()

  if (!container) {
    readingProgress.value = getReadingProgressState()
    return
  }

  readingProgress.value = getReadingProgressState({
    scrollTop: scrollTop ?? container.scrollTop,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight
  })
}

const updatePageMinHeight = () => {
  const pageContainerEl = pageContainer.value?.$el || pageContainer.value
  const submenuEl = submenu.value?.$el || submenu.value

  if (!pageContainerEl) {
    return
  }

  const pageContainerStyles = window.getComputedStyle(pageContainerEl)
  const headerHeight = Number.parseFloat(pageContainerStyles.paddingTop) || 0
  const measuredSubmenuHeight = showSubmenu.value ? (submenuEl?.offsetHeight || 0) : 0
  const isMobile = $q.screen.lt.md
  const totalOffset = Math.max(0, Math.round(headerHeight + (isMobile || !showSubmenu.value ? 0 : measuredSubmenuHeight)))

  pageMinHeight.value = `calc(100vh - ${totalOffset}px)`
  submenuHeight.value = `${showSubmenu.value ? Math.max(36, Math.round(measuredSubmenuHeight)) : 0}px`
  pageBottomInset.value = isMobile && showSubmenu.value ? submenuHeight.value : '0px'
  syncReadingProgress()
}

const schedulePageMinHeightUpdate = () => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      updatePageMinHeight()
    })
  })
}

const scheduleRouteHashScroll = () => {
  if (routeHashScrollTimeout.value) {
    clearTimeout(routeHashScrollTimeout.value)
    routeHashScrollTimeout.value = null
  }

  if (showToc.value || !route.hash) {
    return
  }

  routeHashScrollTimeout.value = setTimeout(() => {
    scrollToAnchor(route.hash, false)
    routeHashScrollTimeout.value = null
  }, 500)
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
const layoutAssistant = computed({
  get: () => store.state.layout.assistant,
  set: (value) => store.commit('layout/setAssistant', value)
})
const assistantWidth = computed(() => store.state.layout.assistantWidth || assistantConfig.ui.drawerWidth)
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
const shouldShowBackToTopControl = computed(() => {
  return props.showBackToTopControl && readingProgress.value.hasOverflow && readingProgress.value.isVisible
})
const rightRailState = computed(() => getAssistantRightRailState({
  tocOpen: showToc.value && layoutMeta.value,
  assistantOpen: assistantEnabled && layoutAssistant.value,
  screenWidth: $q.screen.width,
  assistantWidth: assistantWidth.value,
  mobileBreakpoint: 768
}))
const rightRailOpen = computed(() => {
  return !rightRailState.value.isMobile && (rightRailState.value.showToc || rightRailState.value.showAssistant)
})
const mobileAssistantOpen = computed({
  get: () => assistantEnabled && rightRailState.value.isMobile && layoutAssistant.value,
  set: (value) => { layoutAssistant.value = value }
})
const mobileTocOpen = computed({
  get: () => showToc.value && rightRailState.value.isMobile && layoutMeta.value,
  set: (value) => { layoutMeta.value = showToc.value && value }
})
const backToTopRightOffset = computed(() => {
  return rightRailState.value.backToTopRightOffset
})
const currentMarkdownUrl = computed(() => {
  if (store.state.page.base === 'home') {
    return `${window.location.origin}/Homepage.${locale.value}.md`
  }

  const path = route.path.replace(/\/+$/, '')
  return `${window.location.origin}${path || '/homepage'}.md`
})
const currentPageTitle = computed(() => {
  const data = route.matched?.[0]?.meta?.data || route.meta?.data || {}
  return data?.[locale.value]?.title || data?.['*']?.title || data?.['en-US']?.title || ''
})

const toggleSectionsTree = () => {
  if (!showToc.value) return
  layoutMeta.value = !layoutMeta.value
}

const closeAssistant = () => {
  layoutAssistant.value = false
}

const onAssistantResize = (value) => {
  const maxWidth = Math.max(320, Math.min(620, Math.round($q.screen.width - 480)))
  const clamped = Math.min(maxWidth, Math.max(320, Math.round(Number(value) || 0)))
  store.commit('layout/setAssistantWidth', clamped)
}

const setRightRailOpen = (value) => {
  if (!value) {
    layoutMeta.value = false
    layoutAssistant.value = false
  }
}

const pActive = (relative) => {
  if (relative === '/' && (store.state.page.relative === relative || store.state.page.relative === '')) {
    return 'active'
  } else if (store.state.page.relative === relative) {
    return 'active'
  }
  return null
}

const normalizeRoutePath = (path) => {
  const normalized = String(path || '').trim()
  if (normalized === '' || normalized === '/') {
    return '/'
  }

  const sanitized = normalized.replace(/\/+$/, '')
  return sanitized === '' ? '/' : sanitized
}

const isSameEffectivePage = (from, to) => {
  return normalizeRoutePath(from?.path) === normalizeRoutePath(to?.path)
}

const subroute = (to) => {
  const base = '/' + store.state.page.base
  const relative = store.state.page.relative
  let path = base

  if (to !== '/') {
    path += to + '/'
  }

  if (relative === to) {
    return router.push({ hash: '#0' })
  }

  router.push(path)
  return true
}

const resetPageScroll = () => {
  getPageScrollContainer()?.style.removeProperty(ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY)

  if (pageScrollArea.value !== null) {
    pageScrollArea.value.setScrollPosition('vertical', 0, 0)
  }
  syncReadingProgress(0)
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

const handleContentAnchorClick = (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return
  }

  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  const link = target.closest('a[href]')
  if (!link) {
    return
  }

  const href = link.getAttribute('href') || ''
  if (!href.startsWith('#') || href === '#') {
    return
  }

  event.preventDefault()
  navigate(href)
}

const handlePageScroll = (scrollState) => {
  scrolling(scrollState)
  syncReadingProgress(scrollState?.position?.top)
}

const scrollToTop = () => {
  navigate(0)
}

onMounted(() => {
  window.addEventListener('keydown', handleMainScrollKeys)
  window.addEventListener('resize', schedulePageMinHeightUpdate)
  nextTick(() => {
    schedulePageMinHeightUpdate()
    scheduleRouteHashScroll()
  })

  router.beforeEach((to, from, next) => {
    const sameEffectivePage = isSameEffectivePage(from, to)
    const hashOnlyNavigation = sameEffectivePage && to.hash !== ''

    if (!hashOnlyNavigation) {
      resetPageScroll()
    }

    if (to.hash === '' && !sameEffectivePage) {
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

  if (routeHashScrollTimeout.value) {
    clearTimeout(routeHashScrollTimeout.value)
  }
})

watch(() => route.fullPath, () => {
  nextTick(() => {
    schedulePageMinHeightUpdate()
    syncReadingProgress(0)
    scheduleRouteHashScroll()
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
  :class="[
    `d-page-layout--${pageLayout.mode}`,
    isFullwidthContent ? 'd-page-layout--fullwidth-content' : 'd-page-layout--contained-content'
  ]"
>
  <q-toolbar
    v-if="showSubmenu"
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
      <q-btn v-if="showToc" class="d-submenu__toggle" :class="layoutMeta ? 'active' : null" @click="toggleSectionsTree" icon="account_tree">
        <q-tooltip>{{ $t('page.edit.anchor') }}</q-tooltip>
      </q-btn>
    </div>
  </q-toolbar>

  <q-page id="page">
    <q-scroll-area class="content" :class="main" ref="pageScrollArea">
      <div id="scroll-container" :class="isFullwidthContent ? 'd-scroll-container--fullwidth' : null" @click="handleContentAnchorClick">
        <slot />
      </div>
      <d-page-meta v-if="showPageMeta" />
      <d-footer-outlet />
      <q-scroll-observer @scroll="handlePageScroll" :debounce="300" />
    </q-scroll-area>
  </q-page>

  <div
    v-if="shouldShowBackToTopControl"
    class="d-back-to-top"
    :style="{ '--d-back-to-top-right': backToTopRightOffset }"
  >
    <q-circular-progress
      class="d-back-to-top__progress"
      :value="readingProgress.progressPercent"
      size="58px"
      :thickness="0.16"
      color="primary"
      track-color="grey-5"
    />
    <q-btn
      class="d-back-to-top__button"
      round
      dense
      unelevated
      color="dark"
      text-color="white"
      icon="north"
      :aria-label="$t('system.backToTop')"
      @click="scrollToTop"
    >
      <q-tooltip anchor="top middle" self="bottom middle" :offset="[10, 10]">{{ $t('system.backToTop') }}</q-tooltip>
    </q-btn>
  </div>

  <q-drawer
    v-if="!rightRailState.isMobile"
    elevated
    show-if-above
    side="right"
    :model-value="rightRailOpen"
    :width="rightRailState.totalWidth || 308"
    class="d-right-rail-drawer"
    @update:model-value="setRightRailOpen"
  >
    <div class="d-right-rail">
      <div v-if="showToc && rightRailState.showToc" class="d-right-rail__toc" :style="{ width: `${rightRailState.tocWidth}px` }">
        <d-page-anchor id="anchor" />
      </div>
      <q-separator v-if="showToc && rightRailState.showToc && rightRailState.showAssistant" vertical />
      <d-assistant-panel
        v-if="rightRailState.showAssistant"
        class="d-right-rail__assistant"
        :style="{ width: `${rightRailState.assistantWidth}px` }"
        :context-title="currentPageTitle"
        :markdown-url="currentMarkdownUrl"
        :width="rightRailState.assistantWidth"
        resizable
        @resize="onAssistantResize"
        @close="closeAssistant"
      />
    </div>
  </q-drawer>

  <q-dialog
    v-if="showToc"
    v-model="mobileTocOpen"
    position="right"
    square
    full-height
    class="d-mobile-anchor-dialog"
  >
    <div id="anchor" class="d-mobile-anchor-dialog__panel">
      <d-page-anchor />
    </div>
  </q-dialog>

  <q-dialog
    v-if="assistantEnabled"
    v-model="mobileAssistantOpen"
    maximized
    no-backdrop-dismiss
    class="d-mobile-assistant-dialog"
  >
    <div
      class="d-mobile-assistant-dialog__panel-shell"
      @click.stop
      @mousedown.stop
      @touchstart.stop
    >
      <d-assistant-panel
        class="d-mobile-assistant-panel"
        :context-title="currentPageTitle"
        :markdown-url="currentMarkdownUrl"
        @close="closeAssistant"
      />
    </div>
  </q-dialog>
</q-page-container>
</template>

<style lang="sass">
#page-container
  padding-bottom: 0 !important

.content,
.content > div.scroll
  min-height: var(--d-page-min-height, calc(100vh - 86px))

.content > div.scroll > div.q-scrollarea__content
  --d-page-content-padding-x: 15px
  --d-page-content-padding-bottom: calc(15px + var(--d-page-bottom-inset, 0px) + var(--d-anchor-scroll-extra-bottom, 0px) + env(safe-area-inset-bottom, 0px))
  --d-footer-outlet-padding-x: var(--d-page-content-padding-x)
  --d-footer-outlet-padding-bottom: var(--d-page-content-padding-bottom)
  max-width: 100%
  box-sizing: border-box

.content:not(.no-padding) > div.scroll > div.q-scrollarea__content
  padding: var(--d-page-content-padding-x)
  padding-bottom: var(--d-page-content-padding-bottom)

#page
  min-height: var(--d-page-min-height, calc(100vh - 86px)) !important

.d-back-to-top
  position: fixed
  right: var(--d-back-to-top-right, 24px)
  bottom: calc(24px + var(--d-page-bottom-inset, 0px) + env(safe-area-inset-bottom, 0px))
  width: 58px
  height: 58px
  z-index: 1200
  filter: drop-shadow(0 8px 18px rgba(0,0,0,0.2))

  .d-back-to-top__progress,
  .d-back-to-top__button
    position: absolute
    inset: 0

  .d-back-to-top__button
    margin: auto
    width: 40px
    height: 40px

.d-mobile-assistant-dialog
  .q-dialog__inner
    padding: 0
    align-items: stretch
    justify-content: stretch

  &__panel-shell
    width: 100vw
    max-width: 100vw
    height: 100dvh
    max-height: 100dvh

  .d-mobile-assistant-panel
    width: 100vw
    max-width: 100vw
    height: 100dvh
    max-height: 100dvh
    margin: 0

.d-mobile-anchor-dialog
  .q-dialog__inner
    padding: 0
    align-items: stretch
    justify-content: flex-end

  .q-dialog__backdrop
    background: rgba(15, 23, 42, 0.24)

  &__panel
    width: min(100vw, 340px)
    max-width: 100vw
    height: 100%
    max-height: 100dvh
    padding-top: env(safe-area-inset-top, 0px)
    padding-bottom: env(safe-area-inset-bottom, 0px)
    background: rgba(248, 250, 252, 0.88)
    backdrop-filter: blur(18px)
    -webkit-backdrop-filter: blur(18px)
    overflow: auto
    box-shadow: -16px 0 40px rgba(15, 23, 42, 0.22)

.d-mobile-anchor-dialog__panel
  opacity: 0.8
body.body--dark
  .d-mobile-anchor-dialog__panel
    background: rgba(15, 23, 42, 0.9)

#scroll-container
  width: 100%
  max-width: 1200px
  margin: auto

#page-container.d-page-layout--fullwidth-content
  #scroll-container,
  #d-page-meta
    max-width: none

  #d-page-meta > .row,
  #d-page-meta > #d-page-nav
    padding-left: 15px
    padding-right: 15px
    box-sizing: border-box

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
    align-self: stretch
    min-height: inherit
    border-radius: 0
    margin-right: 0

    &.active
      background: rgba(255, 255, 255, 0.16)

  .on-left
    margin-right: 5px
  .toolbar-container
    overflow: visible

.d-right-rail
  height: 100%
  display: flex
  min-width: 0
  overflow: hidden

  &__toc
    height: 100%
    min-width: 0
    overflow: auto

  &__assistant
    height: 100%
    min-width: 320px
    flex: 0 0 auto
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
    width: 100%
    max-width: none
    margin: 0
    align-items: stretch

  .toolbar-container
    display: flex
    align-items: center

  .d-submenu__toggle
    margin-right: 0
    padding-right: 12px

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

body.body--light
  .d-back-to-top__progress
    color: var(--q-primary)

body.body--dark
  .d-back-to-top__progress
    color: #58d1a8
</style>
