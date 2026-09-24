/**
 * Asset URLs written in docsector.config.js or in page blocks: absolute,
 * protocol-relative, data: and blob: URLs pass through; root-relative and
 * relative paths are served from the site's base path.
 */

// ! A path of this site: one leading slash, never protocol-relative ('//' —
//   nor '/\\', which browsers read the same way), no whitespace and no
//   backslash — the one definition every config link check shares
export const SITE_PATH = /^\/(?![/\\])[^\s\\]*$/

// : `raw` as a URL the browser can load under `base` ('' for nothing)
export function resolveAssetUrl (raw = '', base = import.meta.env?.BASE_URL || '/') {
  const value = String(raw || '').trim()

  if (!value) {
    return ''
  }

  if (/^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data:|blob:)/i.test(value)) {
    return value
  }

  const trimmedBase = String(base).replace(/\/$/, '')

  if (value.startsWith('/')) {
    return `${trimmedBase}${value}` || value
  }

  // ? duplicate slashes collapse inside the path only — an absolute base
  //   (https://cdn.example/docs/) keeps its `//`, and './/x' can never turn
  //   into a protocol-relative '//x'
  const normalized = value.replace(/\/+/g, '/').replace(/^\.\//, '')
  return `${trimmedBase}/${normalized}`
}
