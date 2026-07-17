/**
 * Theme preference resolution.
 *
 * The reader stores a tri-state theme under `setting.theme`: `auto` follows the
 * operating system (via Quasar's Dark plugin and `prefers-color-scheme`), while
 * `light`/`dark` are explicit overrides.
 *
 * This module is deliberately dependency-free — no `quasar`, no `vue`. It runs
 * before Vue exists (see theme-init.js), its source is mirrored into a pre-paint
 * inline script (see theme.inline.js), and it must stay testable in a plain node
 * environment.
 *
 * Storage note: values are read/written with Quasar's LocalStorage encoding
 * (`__q_strn|<value>`, `__q_bool|1`) so `$q.localStorage` stays interoperable
 * with what we write here, even though we touch `window.localStorage` directly.
 */

export const THEME_STORAGE_KEY = 'setting.theme'
// Pre-4.16 key: a boolean, `true` meaning dark
export const LEGACY_THEME_STORAGE_KEY = 'setting.background'

export const THEMES = ['auto', 'light', 'dark']
export const DEFAULT_THEME = 'auto'

/**
 * Decode a Quasar-encoded storage value.
 * Mirrors quasar/src/plugins/storage/engine/web-storage.js — including the
 * `length < 9` guard for values that were not encoded by Quasar.
 */
function decode (raw) {
  if (typeof raw !== 'string' || raw.length < 9) {
    return raw ?? null
  }

  const type = raw.substring(0, 8)
  const source = raw.substring(9)

  if (type === '__q_strn') {
    return source
  }
  if (type === '__q_bool') {
    return source === '1'
  }

  return raw
}

const encode = (value) => `__q_strn|${value}`

/** Map a theme to the value Quasar's `Dark.set()` expects. */
export function toDarkValue (theme) {
  if (theme === 'dark') {
    return true
  }
  if (theme === 'light') {
    return false
  }

  return 'auto'
}

/** Map Quasar's `Dark.mode` (true|false|'auto') back to a theme. */
export function fromDarkValue (mode) {
  if (mode === true) {
    return 'dark'
  }
  if (mode === false) {
    return 'light'
  }

  return 'auto'
}

/**
 * Resolve the reader's stored theme, migrating the pre-4.16 boolean key.
 *
 * Migration: a legacy `true` can only come from an explicit click (the old
 * default wrote `false`), so it becomes `dark`. A legacy `false` is
 * indistinguishable from "never chose" — the old code seeded it on every first
 * visit — so it yields `auto`, which is also the new default.
 */
export function resolveStoredTheme ({ storage } = {}) {
  try {
    const theme = decode(storage?.getItem(THEME_STORAGE_KEY))

    // ? the current key always wins
    if (THEMES.includes(theme)) {
      return theme
    }

    if (decode(storage?.getItem(LEGACY_THEME_STORAGE_KEY)) === true) {
      return 'dark'
    }

    return DEFAULT_THEME
  } catch {
    // Storage can throw on read (private mode, partitioned contexts)
    return DEFAULT_THEME
  }
}

/** Persist a theme, coercing anything unrecognized to the default. */
export function persistTheme (theme, { storage } = {}) {
  const value = THEMES.includes(theme) ? theme : DEFAULT_THEME

  try {
    storage?.setItem(THEME_STORAGE_KEY, encode(value))
  } catch {
    // Ignore storage errors (private mode, quota)
  }

  return value
}
