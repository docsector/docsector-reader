/**
 * Docsector Reader — Page-content search index
 *
 * With lazy page sources (see src/i18n/sources.js) the sidebar search can no
 * longer scan page markdown out of the vue-i18n messages — only visited pages
 * are merged there. Instead, the build emits one `search-index.<lang>.json`
 * per configured language (route path → lowercased page markdown, see
 * src/quasar.factory.js) and this module fetches it on the first content
 * search, caching it for the session.
 *
 * Failures resolve to null so DMenu can fall back to the legacy in-memory
 * (i18n messages) scan.
 */

const indexes = new Map()
const pendingIndexes = new Map()

export function getContentIndex (lang) {
  return indexes.get(lang) ?? null
}

export function ensureContentIndex (lang, options = {}) {
  const {
    base = import.meta.env?.BASE_URL || '/',
    fetcher = typeof fetch !== 'undefined' ? fetch : null
  } = options

  if (indexes.has(lang)) {
    return Promise.resolve(indexes.get(lang))
  }
  if (pendingIndexes.has(lang)) {
    return pendingIndexes.get(lang)
  }
  if (!lang || !fetcher) {
    return Promise.resolve(null)
  }

  const loading = fetcher(`${base}search-index.${lang}.json`)
    .then((response) => (response?.ok ? response.json() : null))
    .catch(() => null)
    .then((index) => {
      const normalized = (index && typeof index === 'object') ? index : null
      indexes.set(lang, normalized)
      pendingIndexes.delete(lang)
      return normalized
    })

  pendingIndexes.set(lang, loading)

  return loading
}

// ? Test-only: reset module state between specs
export function resetContentIndexes () {
  indexes.clear()
  pendingIndexes.clear()
}
