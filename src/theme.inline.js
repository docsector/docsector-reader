/**
 * Pre-paint theme script.
 *
 * Injected at the top of `<body>` by the `docsector-theme-boot` Vite plugin
 * (see quasar.factory.js). It runs while the parser is still building the page
 * — before the deferred app bundle and before the first paint — so the correct
 * `body--light` / `body--dark` class is already in place when the browser
 * paints. Without it, every dark-mode reader sees a white flash on each load.
 *
 * It mirrors resolveStoredTheme() from theme.js in plain ES5 (it cannot import
 * anything at that point). The storage KEYS are interpolated from theme.js so
 * they can never drift, and tests/theme.spec.js runs one shared matrix against
 * both implementations so the RULE cannot drift either.
 *
 * It deliberately only reads and stamps: the one-time migration write belongs
 * to theme-init.js, where it happens once with the full resolver.
 */
import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from './theme.js'

export const THEME_INLINE_SCRIPT = `(function () {
  try {
    var storage = window.localStorage
    var raw = storage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})
    var theme = null

    if (raw && raw.length >= 9 && raw.substring(0, 8) === '__q_strn') {
      theme = raw.substring(9)
    }

    if (theme !== 'auto' && theme !== 'light' && theme !== 'dark') {
      var legacy = storage.getItem(${JSON.stringify(LEGACY_THEME_STORAGE_KEY)})
      var legacyDark = !!legacy && legacy.length >= 9 &&
        legacy.substring(0, 8) === '__q_bool' && legacy.substring(9) === '1'

      theme = legacyDark ? 'dark' : 'auto'
    }

    var dark = theme === 'dark' || (
      theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    var classes = document.body.classList
    classes.remove(dark ? 'body--light' : 'body--dark')
    classes.add(dark ? 'body--dark' : 'body--light')
  } catch (e) {}
})()`
