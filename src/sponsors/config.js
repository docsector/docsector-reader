/**
 * Docsector Sponsors — config normalizer
 *
 * `sponsors` in docsector.config.js is opt-in:
 *
 *   sponsors: {
 *     enabled: true,
 *     fallbackUrl: null,   // example slots, "Your logo here" and the example ad; defaults to links.sponsor
 *     tiers: [{ id: 'platinum', layout: 'wide' }, { id: 'gold', layout: 'square' }],
 *     items: [{ name, tier, href, logo, logoDark? }]
 *   }
 *
 * The logos render under the Table of Contents and follow its visibility.
 * Tiers are listed highest first; an empty tier shows a "Your sponsor here"
 * example slot pointing to the fallback URL.
 *
 * Pure: no Vue, no config import, never throws. Every rejected entry goes
 * through `onWarning` (silent without it), so the build reports it once.
 */
import { resolveAssetUrl } from '../asset-url.js'

// ! Engine-owned layouts a tier picks by name. They render as CSS custom
//   properties, so a new layout is one entry here, one test and one docs row.
export const SPONSOR_LAYOUTS = Object.freeze({
  wide: Object.freeze({ columns: 1, ratio: '3 / 1', width: 300, height: 100 }),
  square: Object.freeze({ columns: 2, ratio: '1 / 1', width: 150, height: 150 })
})

const FALLBACK_LAYOUT = 'square'

const HTTP_URL = /^https?:\/\/\S+$/i
const ROOT_PATH = /^\/(?!\/)\S*$/

const isFilledString = (value) => typeof value === 'string' && value.trim() !== ''

// : a config value as warning text — never throws (BigInt, circular objects)
const describe = (value) => {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return typeof value
  }
}

function warn (onWarning, message) {
  if (typeof onWarning === 'function') {
    onWarning(message)
  }
}

// : whether a config section is enabled — only the boolean true enables it;
//   anything else that is not a plain "off" warns
export function isSectionEnabled (section, name, { onWarning } = {}) {
  if (section === undefined || section === null) return false

  if (typeof section !== 'object' || Array.isArray(section)) {
    warn(onWarning, `${name} must be an object — the section stays disabled`)
    return false
  }

  if (section.enabled === true) return true

  if (section.enabled !== undefined && section.enabled !== false && section.enabled !== null) {
    warn(onWarning, `${name}.enabled must be the boolean true — the section stays disabled`)
  }

  return false
}

// : an http(s) URL or root-relative path, or null — blank means "not set"
const readLink = (value, name, consequence, onWarning) => {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' && value.trim() === '') return null

  const url = typeof value === 'string' ? value.trim() : ''
  if (HTTP_URL.test(url) || ROOT_PATH.test(url)) return url

  warn(onWarning, `${name} must be an http(s) URL or a root-relative path — ${consequence}`)
  return null
}

// : where the example slots, the "Your logo here" button and the example ad
//   point — sponsors.fallbackUrl, then links.sponsor, then nothing
export function resolveSponsorFallbackUrl (config = {}, { onWarning } = {}) {
  return readLink(config?.sponsors?.fallbackUrl, 'sponsors.fallbackUrl', 'ignored', onWarning)
    ?? readLink(config?.links?.sponsor, 'links.sponsor', 'not used as the sponsors fallback', onWarning)
}

// : link attributes for the fallback link — the project's own sponsor page:
//   a new tab when it lives on another site, the same tab for a site path
export function resolveFallbackLinkAttrs (url) {
  return typeof url === 'string' && HTTP_URL.test(url)
    ? { target: '_blank', rel: 'noopener' }
    : {}
}

export function normalizeSponsorsConfig (config = {}, { base, onWarning } = {}) {
  const section = config?.sponsors

  if (!isSectionEnabled(section, 'sponsors', { onWarning })) {
    return { enabled: false, visible: false, fallback: null, tiers: [] }
  }

  const fallback = resolveSponsorFallbackUrl(config, { onWarning })

  // @ Tiers — declaration order is display order
  const tiers = []
  const declared = new Map()
  const tierList = Array.isArray(section.tiers) ? section.tiers : []

  if (tierList.length === 0) {
    warn(onWarning, 'sponsors.tiers must list at least one { id, layout } tier')
  }

  tierList.forEach((tier, index) => {
    const id = tier?.id

    if (!isFilledString(id)) {
      warn(onWarning, `sponsors.tiers[${index}] needs a non-empty string id — ignored`)
      return
    }
    if (declared.has(id)) {
      warn(onWarning, `sponsors.tiers[${index}] repeats the id "${id}" — ignored`)
      return
    }

    let layout = tier.layout
    if (typeof layout !== 'string' || !Object.hasOwn(SPONSOR_LAYOUTS, layout)) {
      warn(onWarning, `sponsors.tiers[${index}] ("${id}") has an unknown layout ${describe(layout)} — using "${FALLBACK_LAYOUT}" (valid: ${Object.keys(SPONSOR_LAYOUTS).join(', ')})`)
      layout = FALLBACK_LAYOUT
    }

    const entry = { id, layout, ...SPONSOR_LAYOUTS[layout], items: [], example: false }
    declared.set(id, entry)
    tiers.push(entry)
  })

  // @ Sponsors — kept in config order inside their tier
  const itemList = Array.isArray(section.items) ? section.items : []

  itemList.forEach((item, index) => {
    const label = `sponsors.items[${index}]`

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      warn(onWarning, `${label} must be an object — ignored`)
      return
    }
    if (!isFilledString(item.name)) {
      warn(onWarning, `${label} needs a name — ignored`)
      return
    }

    const where = `${label} ("${item.name.trim()}")`
    const tier = typeof item.tier === 'string' ? declared.get(item.tier) : undefined

    if (tier === undefined) {
      warn(onWarning, `${where} names an undeclared tier ${describe(item.tier)} (declared: ${[...declared.keys()].join(', ') || 'none'}) — ignored`)
      return
    }

    const href = typeof item.href === 'string' ? item.href.trim() : ''
    if (!HTTP_URL.test(href)) {
      warn(onWarning, `${where} needs an absolute http(s) href — ignored`)
      return
    }
    if (!isFilledString(item.logo)) {
      warn(onWarning, `${where} needs a logo — ignored`)
      return
    }

    let logoDark = null
    if (item.logoDark !== undefined && item.logoDark !== null) {
      if (isFilledString(item.logoDark)) {
        logoDark = resolveAssetUrl(item.logoDark, base)
      } else {
        warn(onWarning, `${where} has an invalid logoDark — ignored, the light logo is used`)
      }
    }

    tier.items.push({
      key: `${tier.id}:${tier.items.length}`,
      name: item.name.trim(),
      href,
      logo: resolveAssetUrl(item.logo, base),
      logoDark
    })
  })

  // @ An empty tier shows an example slot — or disappears without a fallback link
  const shown = tiers.filter(tier => {
    if (tier.items.length > 0) return true

    tier.example = fallback !== null
    return tier.example
  })

  const visible = shown.length > 0 || fallback !== null
  if (!visible) {
    warn(onWarning, 'sponsors is enabled but has nothing to show — add a sponsor, or set sponsors.fallbackUrl or links.sponsor')
  }

  return { enabled: true, visible, fallback, tiers: shown }
}
