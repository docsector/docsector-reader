import { store } from 'quasar/wrappers'
import { createStore } from 'vuex'

import app from './App'
import i18n from './I18n'
import layout from './Layout'
import page from './Page'
import settings from './Settings'

export default store(function (/* { ssrContext } */) {
  const Store = createStore({
    modules: {
      app,
      i18n,
      page,
      layout,
      settings
    },

    strict: process.env.DEBUGGING
  })

  return Store
})
