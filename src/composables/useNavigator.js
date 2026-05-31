import { scroll, Platform } from 'quasar'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

import { DEFAULT_ACTIVE_ANCHOR_OFFSET, getActiveAnchorId } from './useActiveAnchor'
import { ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY, getAnchorScrollExtraBottom, setAnchorScrollExtraBottom } from './anchor-scroll-state'

export default function useNavigator() {
  const store = useStore()
  const router = useRouter()
  const route = useRoute()
  const selected = ref(null)

  const normalizeScrollTarget = (target) => {
    if (target === document.body || target === document.documentElement) {
      return window
    }

    return target
  }

  const getScrollTargetTop = (target) => {
    if (target === window) {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    }

    return target?.scrollTop || 0
  }

  const getScrollTargetRectTop = (target) => {
    if (target === window) {
      return 0
    }

    return target?.getBoundingClientRect?.().top || 0
  }

  const getAnchorTopOffset = (anchorEl) => {
    if (!(anchorEl instanceof HTMLElement)) {
      return 0
    }

    const explicitOffset = Number.parseFloat(anchorEl.dataset.anchorOffsetTop || '')

    if (Number.isFinite(explicitOffset)) {
      return Math.max(0, explicitOffset)
    }

    return 0
  }

  const syncAnchorScrollExtraBottom = (scrollTarget, offsetTop) => {
    if (!(scrollTarget instanceof HTMLElement)) {
      return
    }

    const extraBottom = getAnchorScrollExtraBottom({
      offsetTop,
      scrollHeight: scrollTarget.scrollHeight,
      clientHeight: scrollTarget.clientHeight,
      currentExtraBottom: Number.parseFloat(scrollTarget.style.getPropertyValue(ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY) || '')
    })

    setAnchorScrollExtraBottom(scrollTarget, extraBottom)

    if (extraBottom > 0) {
      void scrollTarget.scrollHeight
    }
  }

  const resolveAnchorScrollState = (anchorEl, { syncExtraBottom = true } = {}) => {
    if (!(anchorEl instanceof HTMLElement)) {
      return null
    }

    const pageScrollContainer = anchorEl.closest('.q-scrollarea__container')
    const scrollTarget = normalizeScrollTarget(pageScrollContainer || scroll.getScrollTarget(anchorEl))
    const anchorRect = anchorEl.getBoundingClientRect()
    const scrollTop = getScrollTargetTop(scrollTarget)
    const targetRectTop = getScrollTargetRectTop(scrollTarget)
    const anchorTopOffset = getAnchorTopOffset(anchorEl)

    const offsetTop = Math.max(0, ((anchorRect.top - targetRectTop) + scrollTop) - anchorTopOffset)

    if (syncExtraBottom) {
      syncAnchorScrollExtraBottom(scrollTarget, offsetTop)
    }

    return {
      scrollTarget,
      offsetTop
    }
  }

  const normalizeDomAnchorId = (id) => {
    if (id === null || id === undefined || id === false) {
      return ''
    }

    let normalized = String(id).replace(/^#+/g, '')

    try {
      normalized = decodeURIComponent(normalized)
    } catch {
      // Keep the raw fragment when it is not valid percent-encoding.
    }

    return normalized
  }

  const normalizeStoreAnchorId = (id) => {
    const normalized = normalizeDomAnchorId(id)
    return normalized === '0' ? 0 : normalized
  }

  const register = (id) => {
    store.commit('page/pushAnchors', normalizeStoreAnchorId(id))
  }

  const index = (id, child = false) => {
    store.commit('page/pushNodes', {
      id: normalizeStoreAnchorId(id),
      label: selected.value,
      child,
      children: []
    })
  }

  const select = (id) => {
    const normalized = normalizeStoreAnchorId(id)

    if (store.state.page.anchor !== normalized) {
      store.commit('page/setAnchor', normalized)
    }

    store.commit('page/pushNodesExpanded', normalized)
  }

  const anchor = (id, toSelect = true) => {
    store.commit('page/setScrolling', false)

    const anchorId = normalizeDomAnchorId(id)
    const Anchor = document.getElementById(anchorId)

    if (Anchor !== null && typeof Anchor === 'object') {
      const scrollState = resolveAnchorScrollState(Anchor)

      if (scrollState !== null) {
        scroll.setVerticalScrollPosition(scrollState.scrollTarget, scrollState.offsetTop, 300)
      }

      setTimeout(() => {
        store.commit('page/setScrolling', true)
      }, 600)
    }

    if (toSelect) {
      select(anchorId)
    }
  }

  const scrolling = (scroll) => {
    const scrolling = store.state.page.scrolling
    if (!scrolling) {
      return
    }

    const activeAnchorId = getActiveAnchorId({
      anchors: store.state.page.anchors,
      scrollTop: scroll?.position?.top,
      scrollOffset: DEFAULT_ACTIVE_ANCHOR_OFFSET,
      rootAnchorId: 0,
      getAnchorOffsetTop: (anchorId) => {
        const domAnchorId = normalizeDomAnchorId(anchorId)

        if (domAnchorId === '') {
          return undefined
        }

        const Anchor = document.getElementById(domAnchorId)

        if (Anchor !== null && typeof Anchor === 'object') {
          return resolveAnchorScrollState(Anchor, { syncExtraBottom: false })?.offsetTop
        }

        return undefined
      }
    })

    select(activeAnchorId)
  }

  const navigate = (value, toAnchor = true) => {
    const domAnchorId = normalizeDomAnchorId(value)
    const currentRouteAnchorId = normalizeDomAnchorId(route.hash)

    if (toAnchor) {
      if (domAnchorId !== '' && domAnchorId === currentRouteAnchorId) {
        anchor(domAnchorId)
        return
      } else if (value === null) {
        anchor(store.state.page.anchor, false)
        return
      }
    }

    router.push({
      path: route.path,
      hash: domAnchorId === '' ? '' : `#${domAnchorId}`
    })

    if (toAnchor) {
      if (Platform.is.desktop) {
        anchor(domAnchorId)
      } else {
        setTimeout(() => {
          anchor(domAnchorId)
        }, 600)
      }
    }
  }

  return {
    register,
    index,
    select,
    anchor,
    scrolling,
    navigate,
    selected
  }
}
