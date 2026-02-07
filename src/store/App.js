export default {
  namespaced: true,

  state: {},
  getters: {},
  mutations: {},
  actions: {
    configureLanguage ({ commit, state }, routeMatched) {
      // Reset stale nodes before configuring new language state
      commit('page/resetAnchor', null, { root: true })
      commit('page/resetAnchors', null, { root: true })
      commit('page/resetNodes', null, { root: true })

      // Route
      const firstRoutePath = routeMatched[0].path
      const secondRoutePath = routeMatched[1].path

      const base = firstRoutePath.substr(1)
      let relative = secondRoutePath.substr(firstRoutePath.length)

      commit('page/setBase', base, { root: true })
      commit('page/setRelative', relative, { root: true })
      commit('page/setAbsolute', base + relative, { root: true })

      if (relative === '/' || relative === '') {
        relative = '/overview'
      }

      if (firstRoutePath) {
        const i18nBase = base.replace(/_$/, '').replace(/\//g, '.')
        const i18nRelative = relative.replace(/_$/, '').replace(/\//g, '.')

        commit('i18n/setBase', i18nBase, { root: true })
        commit('i18n/setRelative', i18nRelative.substr(1), { root: true })
        commit('i18n/setAbsolute', i18nBase + i18nRelative, { root: true })
      } else {
        commit('i18n/setBase', '', { root: true })
        commit('i18n/setRelative', '', { root: true })
        commit('i18n/setAbsolute', '', { root: true })
      }
    }
  }
}
