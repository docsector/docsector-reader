/**
 * Docsector Header Links — config normalizer
 *
 * `header.links` in docsector.config.js is opt-in:
 *
 *   header: {
 *     links: [
 *       { label: 'Sponsors', icon: 'favorite', href: '/sponsors/' },
 *       { label: { 'en-US': 'Ecosystem', 'pt-BR': 'Ecossistema' }, icon: 'hub', children: [
 *         { label: 'Benchmarks', href: 'https://example.com/benchmarks' }
 *       ] }
 *     ]
 *   }
 *
 * The links are centered in the header where they fit (a CSS container query
 * on the estimated nav width); elsewhere they open from an arrow attached to
 * the brand. A link with `children` is a dropdown
 * (one level). Where each href opens is MenuLink.resolve's rule.
 *
 * Pure: no Vue, no config import, never throws. Every rejected entry goes
 * through `onWarning` (silent without it), so the build reports it once.
 */
import { isText } from '../i18n/locale-map.js'

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

// : `name (label)` for a warning — the label when there is one
const label = (item, name) => (typeof item?.label === 'string' && item.label.trim() !== '' ? `${name} (${item.label.trim()})` : name)

// : the icon name, or null — an invalid one is dropped with a warning
const readIcon = (item, name, onWarning) => {
  if (item.icon === undefined || item.icon === null) return null
  if (isFilledString(item.icon)) return item.icon.trim()

  warn(onWarning, `${name} has an invalid icon ${describe(item.icon)} — shown without one`)
  return null
}

// : one link without children (a leaf), or null when it cannot render
const readLeaf = (item, name, onWarning) => {
  if (!isFilledString(item.href)) {
    const hint = item.url !== undefined ? ' (write href, not url)' : ''
    warn(onWarning, `${name} needs an href or children${hint} — ignored`)
    return null
  }

  return {
    label: item.label,
    icon: readIcon(item, name, onWarning),
    href: item.href.trim(),
    children: []
  }
}

// : the normalized header links — `{ links: [{ label, icon, href, children }] }`,
//   label kept raw (a string or a locale map, resolved at render time), href
//   null for a dropdown, children one level deep
export function normalize (config = {}, { onWarning } = {}) {
  const section = config?.header

  // ?
  if (section === undefined || section === null) {
    return { links: [] }
  }

  if (typeof section !== 'object' || Array.isArray(section)) {
    warn(onWarning, 'header must be an object — no header links')
    return { links: [] }
  }

  if (section.links === undefined || section.links === null) {
    return { links: [] }
  }

  if (!Array.isArray(section.links)) {
    warn(onWarning, 'header.links must be an array — no header links')
    return { links: [] }
  }

  const links = []

  // @@
  section.links.forEach((item, index) => {
    const name = label(item, `header.links[${index}]`)

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      warn(onWarning, `${name} must be an object — ignored`)
      return
    }

    if (!isText(item.label)) {
      warn(onWarning, `${name} needs a label (a string or a locale map) — ignored`)
      return
    }

    const hasChildren = item.children !== undefined && item.children !== null

    if (hasChildren && !Array.isArray(item.children)) {
      warn(onWarning, `${name} children must be an array — ignored`)
    }

    // ? a leaf: no children (an empty list counts as none)
    if (!Array.isArray(item.children) || item.children.length === 0) {
      const leaf = readLeaf(item, name, onWarning)
      if (leaf !== null) links.push(leaf)
      return
    }

    // @ a dropdown: its own href never renders
    if (item.href !== undefined && item.href !== null) {
      warn(onWarning, `${name} has children — its href is ignored`)
    }

    const children = []
    item.children.forEach((child, childIndex) => {
      const childName = label(child, `header.links[${index}].children[${childIndex}]`)

      if (!child || typeof child !== 'object' || Array.isArray(child)) {
        warn(onWarning, `${childName} must be an object — ignored`)
        return
      }

      if (!isText(child.label)) {
        warn(onWarning, `${childName} needs a label (a string or a locale map) — ignored`)
        return
      }

      // ? grandchildren never render (an empty list is none, as at the top)
      const nested = child.children !== undefined && child.children !== null &&
        !(Array.isArray(child.children) && child.children.length === 0)

      if (nested && !isFilledString(child.href)) {
        warn(onWarning, `${childName} has children — only one level of sublinks is shown, and it has no href of its own — ignored`)
        return
      }

      if (nested) {
        warn(onWarning, `${childName} has children — only one level of sublinks is shown`)
      }

      const leaf = readLeaf(child, childName, onWarning)
      if (leaf !== null) children.push(leaf)
    })

    if (children.length === 0) {
      warn(onWarning, `${name} has no valid sublinks — ignored`)
      return
    }

    links.push({
      label: item.label,
      icon: readIcon(item, name, onWarning),
      href: null,
      children
    })
  })

  // :
  return { links }
}

// ! Header nav metrics (px) — deliberately generous: an estimate that runs
//   short would clip the last links, one that runs long only keeps the arrow
//   a little longer. 14px Roboto is ~7.5px per character; a QBtn has 16px of
//   inline padding per side, a left icon 24px + 12px, the dropdown arrow ~24px.
//   A link that opens in a new tab shows no icon in the bar.
const CHARACTER = 8.4
const PADDING = 32
const ICON = 36
const ARROW = 32
const MARGIN = 1.1

// : the longest text a label renders, in characters, over every locale —
//   so the estimate never depends on the reader's language
const measure = (value) => {
  if (typeof value === 'string') return value.trim().length

  return Math.max(0, ...Object.values(value || {}).map(entry => (typeof entry === 'string' ? entry.trim().length : 0)))
}

// : the estimated width (px) of the centered header nav for normalized links
export function estimate (links = []) {
  const width = links.reduce((total, link) => total + PADDING + measure(link.label) * CHARACTER +
    (link.icon !== null ? ICON : 0) +
    (link.children.length > 0 ? ARROW : 0), 0)

  return Math.ceil(width * MARGIN)
}
