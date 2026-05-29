import { scroll, Platform } from 'quasar'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

import { DEFAULT_ACTIVE_ANCHOR_OFFSET, getActiveAnchorId } from './useActiveAnchor'

export default function useNavigator() {
  const store = useStore()
  const router = useRouter()
  const route = useRoute()
  const selected = ref(null)

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
      const ScrollTarget = scroll.getScrollTarget(Anchor)
      const AnchorOffsetTop = Anchor.offsetTop

      scroll.setVerticalScrollPosition(ScrollTarget, AnchorOffsetTop, 300)

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
          return Anchor.offsetTop
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
