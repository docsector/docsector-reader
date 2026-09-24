/**
 * Menu links — the sidebar top links (links.changelog, links.roadmap,
 * links.sponsor and each links.explore[].url) and the header links
 * (header.links[].href) in docsector.config.js.
 *
 * A path of a page of this site opens in place through the router and is
 * highlighted while that page is open; anything else (http(s) URLs, mailto:,
 * static files under public/) keeps opening in a new tab.
 *
 * Pure: never throws. The router only answers whether a path is a page.
 */
import { SITE_PATH } from '../asset-url.js'

// ? a path that names a subpage but matches no page is most likely a typo
const SUBPAGE_PATH = /\/(?:overview|showcase|vs)\/?(?:[?#]\S*)?$/i

// : link attributes for a top link — { to } for a page of this site,
//   { href, target } for anything else, null when nothing is set
export function resolve (url, router, { onWarning } = {}) {
  // ?
  if (typeof url !== 'string' || url.trim() === '') {
    return null
  }

  const value = url.trim()

  if (SITE_PATH.test(value)) {
    // ? every page route and the home route carry meta.book; the catch-all
    //   (404) does not, so a static file such as /sponsor.html stays external
    let book
    try {
      book = router?.resolve(value)?.matched?.[0]?.meta?.book
    } catch {
      book = undefined
    }

    // ?:
    if (typeof book === 'string') {
      return { to: value }
    }

    if (SUBPAGE_PATH.test(value) && typeof onWarning === 'function') {
      onWarning(`${value} is not a page of this site — it opens in a new tab`)
    }
  }

  // :
  return { href: value, target: '_blank' }
}

// : the book a page-tree shortcut (config.link.to) lands in, when that is not
//   the entry's own book — null for no shortcut, the same book or an unknown
//   target. Like resolve(), the router only answers where the path lands.
export function cross (meta, router) {
  const to = typeof meta?.link?.to === 'string' ? meta.link.to.trim() : ''
  // ?
  if (to === '') {
    return null
  }

  // ? routes.js reads a link.to without its leading slash the same way
  const path = to.startsWith('/') ? to : `/${to}`
  if (!SITE_PATH.test(path)) {
    return null
  }

  let book
  try {
    book = router?.resolve(path)?.matched?.[0]?.meta?.book
  } catch {
    book = undefined
  }

  // :
  const own = meta.book ?? meta.type ?? null
  return typeof book === 'string' && book !== own ? book : null
}

// ? a record and its alias copies are one route (/home and its '/' alias)
const same = (a, b) => (a?.aliasOf || a) === (b?.aliasOf || b)
const pathOf = (record) => (record?.aliasOf || record)?.path

// : whether an in-place link to `to` is active on `route` — vue-router's
//   RouterLink rule for docsector's routes: the target's last record is in the
//   current match, or it is the empty child of a page (a bare page path) and
//   that page is. Like resolve(), only a page of this site can be active.
export function check (to, route, router) {
  // ?
  if (typeof to !== 'string' || to === '') {
    return false
  }

  let matched
  try {
    matched = router?.resolve(to)?.matched
  } catch {
    matched = undefined
  }

  if (!Array.isArray(matched) || typeof matched[0]?.meta?.book !== 'string') {
    return false
  }

  const current = Array.isArray(route?.matched) ? route.matched : []
  const last = matched[matched.length - 1]

  if (current.some(record => same(last, record))) {
    return true
  }

  // :
  const parent = matched[matched.length - 2]
  return pathOf(last) === pathOf(parent) && current.some(record => same(parent, record))
}
