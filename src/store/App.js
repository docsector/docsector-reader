export default {
  namespaced: true,

  state: {},
  getters: {},
  mutations: {},
  actions: {
    configureLanguage ({ commit }, routeMatched) {
      // Reset stale nodes before configuring new language state
      commit('page/resetAnchor', null, { root: true })
      commit('page/resetAnchors', null, { root: true })
      commit('page/resetNodes', null, { root: true })

      // Route
      const firstRoutePath = routeMatched[0]?.path || ''
      const secondRoutePath = routeMatched[1]?.path || ''
      const routeMeta = routeMatched[0]?.meta || {}

      const base = firstRoutePath === '/' ? 'home' : firstRoutePath.substr(1)
      let relative = secondRoutePath.substr(firstRoutePath.length)

      if (relative !== '/') {
        relative = relative.replace(/\/+$/, '')
      }

      if (relative === '/' || relative === '') {
        relative = '/overview'
      }

      commit('page/setBase', base, { root: true })
      commit('page/setRelative', relative, { root: true })
      commit('page/setAbsolute', base + relative, { root: true })

      if (firstRoutePath) {
        const fallbackBaseSegments = base
          .replace(/_$/, '')
          .split('/')
          .filter(Boolean)
        const i18nBase = Array.isArray(routeMeta.i18nSegments) && routeMeta.i18nSegments.length > 0
          ? routeMeta.i18nSegments
          : fallbackBaseSegments
        const i18nRelative = relative
          .replace(/_$/, '')
          .split('/')
          .filter(Boolean)

        commit('i18n/setBase', i18nBase, { root: true })
        commit('i18n/setRelative', i18nRelative, { root: true })
        commit('i18n/setAbsolute', [...i18nBase, ...i18nRelative], { root: true })
      } else {
        commit('i18n/setBase', '', { root: true })
        commit('i18n/setRelative', '', { root: true })
        commit('i18n/setAbsolute', '', { root: true })
      }
    }
  }
}
