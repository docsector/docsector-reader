/**
 * Docsector document headers — the path patterns of the cache (and Early
 * Hints) rules written to dist/_headers for the prerendered documents.
 *
 * One wildcard per first route segment (`/guide/*`) covers every document of
 * a book. A document that IS a first segment — the bare path of a standalone
 * page, served as `sponsors/index.html` and `sponsors.html` — also gets an
 * exact rule (`/sponsors`), because `/sponsors/*` never matches it. The home
 * page closes the list.
 *
 * Pure: shared by the SPA meta prerender and the SSR prerender.
 */

// : the rule paths for `paths` (written document paths, with or without
//   slashes), sorted and unique, then '/' and '/index.html'
export function list (paths = []) {
  const rules = new Set()

  for (const raw of paths) {
    const path = String(raw ?? '').replace(/^\/+|\/+$/g, '')
    if (path === '') continue

    const segments = path.split('/')
    rules.add(segments.length === 1 ? `/${path}` : `/${segments[0]}/*`)
  }

  return [...rules].sort().concat(['/', '/index.html'])
}
