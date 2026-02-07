import { scroll, Platform } from 'quasar'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

export default function useNavigator() {
  const store = useStore()
  const router = useRouter()
  const route = useRoute()
  const selected = ref(null)

  const register = (id) => {
    store.commit('page/pushAnchors', id)
  }

  const index = (id, child = false) => {
    store.commit('page/pushNodes', {
      id,
      label: selected.value,
      child,
      children: []
    })
  }

  const select = (id) => {
    store.commit('page/setAnchor', Number(id))
    store.commit('page/pushNodesExpanded', Number(id))
  }

  const anchor = (id, toSelect = true) => {
    store.commit('page/setScrolling', false)

    id = '' + id
    const Anchor = document.getElementById(id)

    if (Anchor !== null && typeof Anchor === 'object') {
      const ScrollTarget = scroll.getScrollTarget(Anchor)
      const AnchorOffsetTop = Anchor.offsetTop

      scroll.setVerticalScrollPosition(ScrollTarget, AnchorOffsetTop, 300)

      setTimeout(() => {
        store.commit('page/setScrolling', true)
      }, 600)
    }

    if (toSelect) {
      select(id)
    }
  }

  const scrolling = (scroll) => {
    const scrolling = store.state.page.scrolling
    if (!scrolling) {
      return
    }

    const scrollPositionTop = scroll.position.top + 50
    const anchors = store.state.page.anchors

    for (let i = 0; i < anchors.length; i++) {
      const anchorId = anchors[i]

      if (anchorId === 0) {
        continue
      }

      const Anchor = document.getElementById(anchorId)
      let AnchorOffsetTop = 20
      if (Anchor !== null && typeof Anchor === 'object') {
        AnchorOffsetTop = Anchor.offsetTop
      }

      if (scrollPositionTop >= AnchorOffsetTop) {
        select(anchorId)
      }
    }
  }

  const navigate = (value, toAnchor = true) => {
    if (toAnchor) {
      if (('#' + value) === route.hash) {
        anchor(value)
        return
      } else if (value === null) {
        anchor(selected.value, false)
        return
      }
    }

    router.push(route.path + '#' + value)

    if (toAnchor) {
      if (Platform.is.desktop) {
        anchor(value)
      } else {
        setTimeout(() => {
          anchor(value)
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
