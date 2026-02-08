import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'

import messages from 'src/i18n'

export default boot(({ app }) => {
  // Detect available locales from messages and pick the best match
  const availableLocales = Object.keys(messages)
  const browserLang = navigator?.language || 'en-US'
  const locale = availableLocales.includes(browserLang)
    ? browserLang
    : availableLocales[0] || 'en-US'

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
})
