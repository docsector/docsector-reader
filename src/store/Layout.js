export default {
  namespaced: true,

  state: {
    header: true,
    footer: true,
    left: false,
    right: false,

    headerReveal: false,
    footerReveal: false,
    leftOverlay: false,
    rightOverlay: false,
    leftBehavior: 'default',
    rightBehavior: 'default',
    leftBreakpoint: 992,
    rightBreakpoint: 992,

    topleft: 'h',
    topcenter: 'H',
    topright: 'h',
    middleleft: 'L',
    middlecenter: 'p',
    middleright: 'r',
    bottomleft: 'l',
    bottomcenter: 'F',
    bottomright: 'f',

    // Main
    scrolling: true,
    meta: true,
    metaToggle: false
  },
  getters: {
    view (state) {
      const
        top = `${state.topleft}${state.topcenter}${state.topright}`,
        middle = `${state.middleleft}${state.middlecenter}${state.middleright}`,
        bottom = `${state.bottomleft}${state.bottomcenter}${state.bottomright}`

      return `${top} ${middle} ${bottom}`
    }
  },
  mutations: {
    setHeader (state, val) {
      state.header = val
    },
    setHeaderReveal (state, val) {
      state.headerReveal = val
    },

    setFooter (state, val) {
      state.footer = val
    },
    setFooterReveal (state, val) {
      state.footerReveal = val
    },

    setLeft (state, val) {
      state.left = val
    },
    setLeftOverlay (state, val) {
      state.leftOverlay = val
    },
    setLeftBehavior (state, val) {
      state.leftBehavior = val
    },
    setLeftBreakpoint (state, val) {
      state.leftBreakpoint = val
    },

    setRight (state, val) {
      state.right = val
    },
    setRightOverlay (state, val) {
      state.rightOverlay = val
    },
    setRightBehavior (state, val) {
      state.rightBehavior = val
    },
    setRightBreakpoint (state, val) {
      state.rightBreakpoint = val
    },

    setTopLeft (state, val) {
      state.topleft = val
    },
    setTopCenter (state, val) {
      state.topcenter = val
    },
    setTopRight (state, val) {
      state.topright = val
    },
    setMiddleLeft (state, val) {
      state.middleleft = val
    },
    setMiddleCenter (state, val) {
      state.middleleft = val
    },
    setMiddleRight (state, val) {
      state.middleright = val
    },
    setBottomLeft (state, val) {
      state.bottomleft = val
    },
    setBottomCenter (state, val) {
      state.bottomcenter = val
    },
    setBottomRight (state, val) {
      state.bottomright = val
    },

    setScrolling (state, val) {
      state.scrolling = val
    },
    setMeta (state, val) {
      state.meta = val
    },
    setMetaToggle (state, val) {
      state.metaToggle = val
    }
  },
  actions: {}
}
