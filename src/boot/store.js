import { boot } from 'quasar/wrappers'
import { createStore } from 'vuex'

import app from '../store/App'
import i18n from '../store/I18n'
import layout from '../store/Layout'
import page from '../store/Page'
import settings from '../store/Settings'

const store = createStore({
  modules: {
    app,
    i18n,
    page,
    layout,
    settings
  },

  strict: process.env.DEBUGGING
})

export default boot(({ app: vueApp }) => {
  vueApp.use(store)
})

export { store }
