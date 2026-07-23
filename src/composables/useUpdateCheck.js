/**
 * Stale-session detection for deployed Docsector sites.
 *
 * The build bakes a build ID into the bundle (`__DOCSECTOR_BUILD__`) and emits
 * the same ID into `dist/spa/version.json` (see src/quasar.factory.js). While
 * a tab stays open, this module polls `version.json` and flips
 * `updateAvailable` when the deployed build no longer matches the running one
 * — the DUpdateBanner component then offers Refresh / Dismiss.
 *
 * It also recovers navigations that break AFTER a deploy: hashed chunks of the
 * old bundle disappear from the server, so lazy route imports reject. When
 * that happens we force a full-page reload straight to the route the user
 * intended, guarded against reload loops.
 *
 * Everything degrades silently: no `version.json` (older deploys, hosts that
 * strip it), no fetch, or dev mode simply means no banner.
 */
import { ref } from 'vue'

import docsectorConfig from 'docsector.config.js'

export const UPDATE_DISMISSED_STORAGE_KEY = 'docsector.update.dismissed.v1'
export const CHUNK_RELOAD_STORAGE_KEY = 'docsector.chunk-reload.v1'

export const DEFAULT_POLL_INTERVAL = 300000
export const MIN_POLL_INTERVAL = 30000
export const STARTUP_CHECK_DELAY = 5000
export const FOCUS_CHECK_THROTTLE = 60000
export const RELOAD_LOOP_WINDOW = 10000

const CHUNK_ERROR_PATTERN = new RegExp([
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Unable to preload CSS'
].join('|'), 'i')

/** Reactive flag consumed by DUpdateBanner — true when a newer build is live. */
export const updateAvailable = ref(false)

let latestDeployedBuild = null

function runningBuild () {
  return typeof __DOCSECTOR_BUILD__ !== 'undefined' ? __DOCSECTOR_BUILD__ : null
}

function safeSessionStorage (win) {
  try {
    return win?.sessionStorage || null
  } catch {
    return null
  }
}

function readStorage (storage, key) {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeStorage (storage, key, value) {
  try {
    storage?.setItem(key, value)
  } catch {
    // Ignore storage errors (private mode, quota)
  }
}

/**
 * Normalize the consumer's `updates` config key.
 *
 * Accepted forms: absent (defaults), `false` (disable), `{ enabled, interval }`.
 * The interval is clamped to a floor so a typo cannot hammer the host.
 */
export function normalizeUpdatesConfig (config) {
  const raw = config?.updates

  if (raw === false) {
    return { enabled: false, interval: DEFAULT_POLL_INTERVAL }
  }

  const enabled = raw?.enabled !== false
  const interval = Number.isFinite(raw?.interval)
    ? Math.max(MIN_POLL_INTERVAL, Number(raw.interval))
    : DEFAULT_POLL_INTERVAL

  return { enabled, interval }
}

/** Reset module state — used by tests. */
export function resetUpdateCheck () {
  updateAvailable.value = false
  latestDeployedBuild = null
}

/**
 * Hide the banner and remember the dismissed deployed build for the session.
 * A NEWER deploy later still re-prompts; a new session re-prompts too.
 */
export function dismissUpdate (options = {}) {
  const win = options.win || (typeof window !== 'undefined' ? window : null)
  const storage = options.storage || safeSessionStorage(win)

  if (latestDeployedBuild !== null) {
    writeStorage(storage, UPDATE_DISMISSED_STORAGE_KEY, latestDeployedBuild)
  }

  updateAvailable.value = false
}

/**
 * Start polling `version.json` for a newer deployed build.
 *
 * Checks shortly after startup (catches a CDN-stale index.html), on a fixed
 * interval while the tab is visible, and on tab re-focus (throttled).
 * Returns a cleanup function; returns a no-op when disabled, in dev mode, or
 * outside a browser/bundle context.
 */
export function setupUpdateCheck (options = {}) {
  const {
    config = docsectorConfig,
    build = runningBuild(),
    dev = Boolean(import.meta.env?.DEV),
    base = import.meta.env?.BASE_URL || '/',
    win = typeof window !== 'undefined' ? window : null,
    doc = typeof document !== 'undefined' ? document : null,
    fetcher = typeof fetch !== 'undefined' ? fetch : null
  } = options

  const { enabled, interval } = normalizeUpdatesConfig(config)

  // ? polling needs production mode, a baked build ID and a browser context
  if (!enabled || dev || !build || !win || !doc || !fetcher) {
    return () => {}
  }

  const storage = options.storage || safeSessionStorage(win)

  let lastCheckAt = 0

  const check = async () => {
    lastCheckAt = Date.now()

    try {
      const response = await fetcher(`${base}version.json`, { cache: 'no-store' })
      if (!response?.ok) return

      const payload = await response.json()
      const deployed = typeof payload?.build === 'string' ? payload.build : null

      // ? same build, malformed payload or an already-dismissed deploy
      if (!deployed || deployed === build) return
      latestDeployedBuild = deployed
      if (deployed === readStorage(storage, UPDATE_DISMISSED_STORAGE_KEY)) return

      updateAvailable.value = true
    } catch {
      // Silent: offline, or the host has no version.json
    }
  }

  const startupTimer = setTimeout(check, STARTUP_CHECK_DELAY)

  const pollTimer = setInterval(() => {
    if (doc.visibilityState !== 'visible') return
    check()
  }, interval)

  const onVisibility = () => {
    if (doc.visibilityState !== 'visible') return
    if (Date.now() - lastCheckAt < FOCUS_CHECK_THROTTLE) return
    check()
  }
  doc.addEventListener('visibilitychange', onVisibility)

  return () => {
    clearTimeout(startupTimer)
    clearInterval(pollTimer)
    doc.removeEventListener('visibilitychange', onVisibility)
  }
}

/** Match the errors a stale bundle produces when its hashed chunks are gone. */
export function isChunkLoadError (error) {
  if (!error) return false

  return CHUNK_ERROR_PATTERN.test(String(error?.message || error))
}

/**
 * Full-page reload to the route the user intended, replacing the stale SPA.
 *
 * The failed chunk must first be confirmed as a real stale deploy: transient
 * network failures (and headless agent sandboxes that block a request) raise
 * the same chunk errors, and a reload there fixes nothing — it only destroys
 * scanners' evaluation contexts mid-check. Only a deployed build that differs
 * from the running one justifies navigating; when version.json is unreachable
 * the state is unverifiable and the reload is skipped.
 *
 * A sessionStorage guard blocks a second reload of the same target within a
 * short window: a genuinely broken deploy would loop forever, so the fallback
 * is the update banner instead. Resolves true when a reload was issued.
 */
export async function forceReload (path, options = {}) {
  const win = options.win || (typeof window !== 'undefined' ? window : null)
  if (!win) return false

  // ? verify against the deployed build — skipped when no build id is baked
  //   (dev/tests), where the old immediate-reload behavior remains
  const build = options.build !== undefined ? options.build : runningBuild()
  const fetcher = options.fetcher || (typeof fetch !== 'undefined' ? fetch : null)
  if (build && fetcher) {
    const base = options.base !== undefined ? options.base : (import.meta.env?.BASE_URL || '/')
    try {
      const response = await fetcher(`${base}version.json`, { cache: 'no-store' })
      if (!response?.ok) return false

      const payload = await response.json()
      const deployed = typeof payload?.build === 'string' ? payload.build : null
      if (!deployed || deployed === build) return false
    } catch {
      return false
    }
  }

  const storage = options.storage || safeSessionStorage(win)
  const target = path || `${win.location?.pathname || '/'}${win.location?.search || ''}${win.location?.hash || ''}`

  // ? this target already forced a reload moments ago — fall back to the banner
  const rawGuard = readStorage(storage, CHUNK_RELOAD_STORAGE_KEY)
  if (rawGuard !== null) {
    try {
      const guard = JSON.parse(rawGuard)
      if (guard?.path === target && Date.now() - guard.at < RELOAD_LOOP_WINDOW) {
        updateAvailable.value = true
        return false
      }
    } catch {
      // Malformed guard — treat as absent
    }
  }

  writeStorage(storage, CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({ path: target, at: Date.now() }))
  win.location.assign(target)
  return true
}

/**
 * Install the stale-chunk recovery handlers on the router and window.
 *
 * `router.onError` catches failed lazy ROUTE imports (with the intended
 * destination); `vite:preloadError` catches failed preloads of non-route
 * chunks (mermaid, katex, ...). Returns a cleanup function.
 */
export function setupChunkReload (options = {}) {
  const {
    router = null,
    win = typeof window !== 'undefined' ? window : null
  } = options

  if (!win) {
    return () => {}
  }

  let removeRouterHandler = null
  if (router) {
    removeRouterHandler = router.onError((error, to) => {
      if (isChunkLoadError(error)) {
        forceReload(to?.fullPath, options)
      }
    })
  }

  const onPreloadError = (event) => {
    event.preventDefault()
    forceReload(null, options)
  }
  win.addEventListener('vite:preloadError', onPreloadError)

  return () => {
    if (typeof removeRouterHandler === 'function') {
      removeRouterHandler()
    }
    win.removeEventListener('vite:preloadError', onPreloadError)
  }
}
