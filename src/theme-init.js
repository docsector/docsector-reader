/**
 * Applies the reader's stored theme before Quasar's Dark plugin can override it.
 *
 * ORDERING — the reason this is not a boot file:
 *
 *   1. The generated app.js statically imports App.vue, which imports this
 *      module, so this code runs during module evaluation — before app.js's
 *      body calls `app.use(Quasar)`.
 *   2. `app.use(Quasar)` installs the Dark plugin, which unconditionally calls
 *      `set($q.config.dark)` on first install. That config is a build-time JSON
 *      literal ('auto'), so it resolves from the OS and would overwrite an
 *      explicit preference.
 *   3. A boot file cannot repair it in time: client-entry.js only runs boot
 *      functions after ALL boot modules resolve, and none of them is
 *      modulepreloaded (the i18n one is ~255 KB), so the wrong theme would be
 *      painted for the whole download.
 *
 * So we queue the apply as a microtask: it lands at the first `await` inside
 * createQuasarApp — after the plugin installed, but still inside the same task,
 * and microtasks always drain before the browser paints. The install's value is
 * therefore never rendered.
 *
 * Fail-safe: if anything here throws, `framework.config.dark = 'auto'` still
 * applies and the reader follows their OS — the correct default, just without
 * their explicit override.
 */
import { Dark } from 'quasar'

import { persistTheme, resolveStoredTheme, toDarkValue } from './theme.js'

if (typeof window !== 'undefined') {
  try {
    const storage = window.localStorage

    const theme = resolveStoredTheme({ storage })
    // ! collapses the legacy boolean key into `setting.theme` once
    persistTheme(theme, { storage })

    // @ after Dark.install(), before the first paint
    queueMicrotask(() => {
      Dark.set(toDarkValue(theme))
    })
  } catch {
    // Ignore — the framework.config.dark fail-safe takes over
  }
}
