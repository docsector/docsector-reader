export const PAGE_LAYOUT_DEFAULT = 'default'
export const PAGE_LAYOUT_FULLWIDTH = 'fullwidth'

const PAGE_LAYOUT_PRESETS = Object.freeze({
  [PAGE_LAYOUT_DEFAULT]: Object.freeze({
    mode: PAGE_LAYOUT_DEFAULT,
    sidebar: true,
    submenu: true,
    toc: true,
    footer: true,
    contentWidth: 'contained'
  }),
  [PAGE_LAYOUT_FULLWIDTH]: Object.freeze({
    mode: PAGE_LAYOUT_FULLWIDTH,
    sidebar: false,
    submenu: false,
    toc: false,
    footer: true,
    contentWidth: 'fullwidth'
  })
})

export const HOME_PAGE_FULLWIDTH_LAYOUT = Object.freeze({
  ...PAGE_LAYOUT_PRESETS[PAGE_LAYOUT_FULLWIDTH],
  footer: false
})

const normalizeLayoutMode = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')

  if (normalized === PAGE_LAYOUT_FULLWIDTH) {
    return PAGE_LAYOUT_FULLWIDTH
  }

  return PAGE_LAYOUT_DEFAULT
}

const normalizeBoolean = (value, fallback) => {
  if (typeof value === 'boolean') return value
  if (value === undefined || value === null) return fallback

  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false

  return fallback
}

const firstDefined = (source, keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined) {
      return source[key]
    }
  }

  return undefined
}

const normalizeContentWidth = (value, fallback) => {
  if (value === undefined || value === null) return fallback

  const normalized = String(value).trim().toLowerCase().replace(/[\s_-]+/g, '-')
  if (['full', 'fullwidth', 'full-width', 'wide', 'fluid'].includes(normalized)) {
    return 'fullwidth'
  }

  return 'contained'
}

const toLayoutPatch = (source) => {
  if (typeof source === 'string') {
    return { mode: normalizeLayoutMode(source) }
  }

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null
  }

  const patch = {}
  const mode = firstDefined(source, ['mode', 'layout', 'preset', 'name', 'type'])
  if (mode !== undefined) {
    patch.mode = normalizeLayoutMode(mode)
  }

  const sidebar = firstDefined(source, ['sidebar', 'menu', 'left'])
  const submenu = firstDefined(source, ['submenu', 'subpage', 'subpageBar'])
  const toc = firstDefined(source, ['toc', 'tableOfContents', 'anchors', 'meta'])
  const footer = firstDefined(source, ['footer', 'nav', 'navigationFooter'])
  const contentWidth = firstDefined(source, ['contentWidth', 'width'])

  if (sidebar !== undefined) patch.sidebar = normalizeBoolean(sidebar, true)
  if (submenu !== undefined) patch.submenu = normalizeBoolean(submenu, true)
  if (toc !== undefined) patch.toc = normalizeBoolean(toc, true)
  if (footer !== undefined) patch.footer = normalizeBoolean(footer, true)
  if (contentWidth !== undefined) patch.contentWidth = normalizeContentWidth(contentWidth, 'contained')

  return patch
}

export function resolvePageLayout (...sources) {
  let layout = { ...PAGE_LAYOUT_PRESETS[PAGE_LAYOUT_DEFAULT] }

  for (const source of sources) {
    const patch = toLayoutPatch(source)
    if (!patch) continue

    if (patch.mode) {
      layout = { ...PAGE_LAYOUT_PRESETS[patch.mode] }
    }

    layout = {
      ...layout,
      ...patch,
      mode: patch.mode || layout.mode,
      contentWidth: normalizeContentWidth(patch.contentWidth, layout.contentWidth)
    }
  }

  return layout
}

export function isHomeRoute (route = {}) {
  const meta = route?.meta || route?.matched?.[0]?.meta || {}
  return meta.book === 'home' || meta.type === 'home'
}

export function resolveHomePageLayout (homePage = {}) {
  const mode = normalizeLayoutMode(homePage?.layout)

  if (mode === PAGE_LAYOUT_FULLWIDTH) {
    return { ...HOME_PAGE_FULLWIDTH_LAYOUT }
  }

  return resolvePageLayout(PAGE_LAYOUT_DEFAULT)
}

export function resolveRoutePageLayout (route = {}) {
  const sources = []

  if (Array.isArray(route?.matched)) {
    for (const record of route.matched) {
      const meta = record?.meta || {}
      if (meta.layout !== undefined) sources.push(meta.layout)
      if (meta.layouts !== undefined) sources.push(meta.layouts)
    }
  }

  const meta = route?.meta || {}
  if (meta.layout !== undefined) sources.push(meta.layout)
  if (meta.layouts !== undefined) sources.push(meta.layouts)

  return resolvePageLayout(...sources)
}
