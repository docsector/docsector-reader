/**
 * Docsector Reader — Lazy page-source loading
 *
 * When the consumer's src/i18n/index.js passes a NON-eager import.meta.glob
 * result to buildMessages(), page markdown stays out of the boot bundle:
 * buildMessages() registers the per-file loaders here and the router awaits
 * loadRouteSources() (beforeResolve) so the target page's markdown — in every
 * available locale — is merged into vue-i18n right before the page renders.
 *
 * Merging every locale per page keeps the whole runtime contract intact:
 * DPageSection (render), DPageBar (copy page), DPageMeta (translation
 * progress across locales) and useWebMcp all keep reading the same
 * `_.<segments>.<subpage>.source` message paths they read in eager mode.
 */

// ! Registry state — populated by buildMessages() (lazy mode) and boot/i18n
let mdLoaders = null
let sourceLangs = []
let filterSource = (source) => source
let composer = null

const mergedKeys = new Set()
const pendingKeys = new Map()

export function registerSourceLoaders ({ loaders, langs, filter }) {
  mdLoaders = loaders || null
  sourceLangs = Array.isArray(langs) ? langs : []

  if (typeof filter === 'function') {
    filterSource = filter
  }
}

export function hasLazySources () {
  return mdLoaders !== null
}

export function bindI18n (i18nComposer) {
  composer = i18nComposer || null
}

// ? Test-only: reset module state between specs
export function resetSourceLoaders () {
  mdLoaders = null
  sourceLangs = []
  filterSource = (source) => source
  composer = null
  mergedKeys.clear()
  pendingKeys.clear()
}

function mdModuleKey (sourcePathBase, subpage, lang) {
  return `../pages/${sourcePathBase}.${subpage}.${lang}.md`
}

function buildSourceMessage (segments, subpage, source) {
  const message = {}
  let node = message

  for (const segment of ['_', ...segments]) {
    node[segment] = {}
    node = node[segment]
  }

  node[subpage] = { source }

  return message
}

function loadSource (routeMeta, subpage, lang) {
  const key = mdModuleKey(routeMeta.sourcePathBase, subpage, lang)

  // ? Already merged, in-flight, or the translation does not exist
  if (mergedKeys.has(key)) {
    return null
  }
  if (pendingKeys.has(key)) {
    return pendingKeys.get(key)
  }

  const loader = mdLoaders[key]
  if (typeof loader !== 'function') {
    return null
  }

  // @ Import the markdown chunk and merge it into the vue-i18n messages
  const segments = routeMeta.i18nSegments
  const loading = loader()
    .then((raw) => {
      // ? Build-compiled token modules ({ v, tokens, ... }) merge untouched —
      //   the escape filter only exists for raw strings that go through t()
      const compiled = typeof raw === 'object' && raw !== null && typeof raw.tokens === 'string'
      const source = compiled ? raw : filterSource(typeof raw === 'string' ? raw : String(raw ?? ''))
      composer.mergeLocaleMessage(lang, buildSourceMessage(segments, subpage, source))
      mergedKeys.add(key)
    })
    .catch((error) => {
      console.warn(`[i18n] Failed to load page source: ${key}`, error)
    })
    .finally(() => {
      pendingKeys.delete(key)
    })

  pendingKeys.set(key, loading)

  return loading
}

/**
 * Load the markdown sources of a route (all enabled subpages × all locales)
 * and merge them into the vue-i18n messages. Resolves once every pending
 * source of the route is merged; never rejects (failed chunks only warn —
 * setupChunkReload's vite:preloadError handler recovers stale deployments).
 *
 * @param {Object} routeMeta - Route meta of the matched page route
 * @returns {Promise<void>}
 */
export function loadRouteSources (routeMeta) {
  // ? Lazy mode off, i18n not booted yet, or route without page sources (home/404)
  if (mdLoaders === null || composer === null || !routeMeta?.sourcePathBase) {
    return Promise.resolve()
  }

  const subpages = ['overview']
  if (routeMeta.subpages?.showcase) {
    subpages.push('showcase')
  }
  if (routeMeta.subpages?.vs) {
    subpages.push('vs')
  }

  const loads = []
  // @@ Load every subpage in every available locale
  for (const lang of sourceLangs) {
    for (const subpage of subpages) {
      const loading = loadSource(routeMeta, subpage, lang)
      if (loading) {
        loads.push(loading)
      }
    }
  }

  return loads.length > 0 ? Promise.all(loads).then(() => {}) : Promise.resolve()
}
