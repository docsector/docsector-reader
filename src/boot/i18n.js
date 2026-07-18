import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'

import docsectorConfig from 'docsector.config.js'
import messages from 'src/i18n'
import { bindI18n } from '../i18n/sources'

export default boot(({ app }) => {
  // Detect available locales from messages and pick the best match
  const availableLocales = Object.keys(messages)
  const browserLang = navigator?.language || 'en-US'
  const preferredLocale = availableLocales.includes(browserLang)
    ? browserLang
    : availableLocales[0] || 'en-US'

  // ? Hydration must FIRST render the language the server serialized (pages
  //   are prerendered in the default language) — starting from the browser
  //   language would hydrate every text node against mismatching markup.
  //   App.vue applies the visitor's stored language right after mount.
  const hydrating = typeof window !== 'undefined' && window.__DOCSECTOR_HYDRATING__ === true
  const serializedLocale = docsectorConfig.defaultLanguage || availableLocales[0] || 'en-US'
  const locale = hydrating && availableLocales.includes(serializedLocale)
    ? serializedLocale
    : preferredLocale

  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: locale,
    missingWarn: false,
    fallbackWarn: false,
    messages
  })

  // Set i18n instance on app
  app.use(i18n)

  // Lazy page sources merge into this composer at navigation time
  bindI18n(i18n.global)
})
