/**
 * Docsector Page Ad — config normalizer and per-page pick
 *
 * `ads` in docsector.config.js is opt-in:
 *
 *   ads: {
 *     enabled: true,
 *     items: [{ href, title, text?, image? }]   // title/text: string or locale map
 *   }
 *
 * Your own creatives, shown above the content of every overview, showcase and
 * vs page (never the home page). Each page shows one creative picked from its
 * normalized path: stable across reloads and identical in the static HTML and
 * the hydrated app. Enabled with no valid creative, an example "Your ad here"
 * ad points to the sponsors fallback URL.
 *
 * Pure: no Vue, no config import, never throws; warnings go through `onWarning`.
 */
import { resolveAssetUrl } from '../asset-url.js'
import { hashString } from '../hash.js'
import { isHomeRoute } from '../page-layout.js'
import { isSectionEnabled, resolveFallbackLinkAttrs, resolveSponsorFallbackUrl } from '../sponsors/config.js'

const HTTP_URL = /^https?:\/\/\S+$/i

const isFilledString = (value) => typeof value === 'string' && value.trim() !== ''

// ? a string, or a locale map with at least one non-empty string
const isText = (value) => {
  if (typeof value === 'string') return value.trim() !== ''
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return Object.values(value).some(isFilledString)
}

function warn (onWarning, message) {
  if (typeof onWarning === 'function') {
    onWarning(message)
  }
}

export function normalizeAdsConfig (config = {}, { base, onWarning } = {}) {
  const section = config?.ads

  if (!isSectionEnabled(section, 'ads', { onWarning })) {
    return { enabled: false, items: [], fallback: null }
  }

  const items = []
  const itemList = Array.isArray(section.items) ? section.items : []

  // @ Creatives — config order
  itemList.forEach((item, index) => {
    const label = `ads.items[${index}]`

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      warn(onWarning, `${label} must be an object — ignored`)
      return
    }

    const href = typeof item.href === 'string' ? item.href.trim() : ''
    if (!HTTP_URL.test(href)) {
      warn(onWarning, `${label} needs an absolute http(s) href — ignored`)
      return
    }
    if (!isText(item.title)) {
      warn(onWarning, `${label} needs a title (a string or a locale map) — ignored`)
      return
    }

    let text = null
    if (item.text !== undefined && item.text !== null) {
      if (isText(item.text)) {
        text = item.text
      } else {
        warn(onWarning, `${label} has an invalid text — ignored`)
      }
    }

    let image = null
    if (item.image !== undefined && item.image !== null) {
      if (isFilledString(item.image)) {
        image = resolveAssetUrl(item.image, base)
      } else {
        warn(onWarning, `${label} has an invalid image — ignored`)
      }
    }

    items.push({ href, title: item.title, text, image })
  })

  // ? the fallback only matters without a creative — resolving it otherwise
  //   would warn about a link nobody uses
  const fallback = items.length === 0 ? resolveSponsorFallbackUrl(config, { onWarning }) : null

  if (items.length === 0 && fallback === null) {
    warn(onWarning, 'ads is enabled but has no valid creative and no sponsors fallback URL — nothing to show')
  }

  return { enabled: true, items, fallback }
}

// : the route path the pick hashes — without trailing slashes, so /x/overview
//   and /x/overview/ (the prerendered and the linked form) pick the same ad
export function normalizeAdPath (path) {
  const normalized = String(path ?? '').replace(/\/+$/, '')
  return normalized === '' ? '/' : normalized
}

// : link attributes of an ad — a creative is a paid placement; the example ad
//   points at the project's own sponsor page
export function resolveAdLinkAttrs (ad) {
  return ad?.example
    ? resolveFallbackLinkAttrs(ad.href)
    : { target: '_blank', rel: 'sponsored noopener' }
}

// : the ad a route shows — one creative per page, the example ad when there is
//   none, or null (disabled, home page, nothing to show)
export function resolvePageAd (ads, route) {
  if (!ads?.enabled || isHomeRoute(route)) return null

  if (ads.items.length > 0) {
    return ads.items[hashString(normalizeAdPath(route?.path)) % ads.items.length]
  }

  return ads.fallback ? { example: true, href: ads.fallback } : null
}
