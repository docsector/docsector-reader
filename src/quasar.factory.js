/**
 * Docsector Reader — Quasar Config Factory
 *
 * This module exports a function that generates a complete Quasar configuration
 * for consumer projects that use @docsector/docsector-reader as a dependency.
 *
 * Usage in consumer's quasar.config.js:
 *
 *   import { createQuasarConfig } from '@docsector/docsector-reader/quasar-factory'
 *   import { configure } from 'quasar/wrappers'
 *
 *   export default configure((ctx) => {
 *     return createQuasarConfig({
 *       projectRoot: import.meta.dirname
 *     })
 *   })
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Absolute path to the consumer project root
 * @param {number} [options.port=8181] - Dev server port
 * @param {Object} [options.pwa] - PWA manifest overrides
 * @param {Array} [options.vitePlugins] - Additional Vite plugins
 * @param {Function} [options.extendViteConf] - Additional Vite config extension
 */

import { readFileSync, existsSync, rmSync, mkdirSync, writeFileSync, readdirSync } from 'fs'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { createRequire } from 'module'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import HJSON from 'hjson'

import { normalizeAiAssistantConfig } from './ai-assistant/config.js'
import { createAiSearchIndexArtifacts } from './ai-assistant/indexing.js'
import { MARKDOWN_AGENT_USER_AGENT_SOURCE, matchesMarkdownAgentUserAgent } from './markdown-agent.js'
import { appendSitemapsToRobots, createSitemap } from './sitemap.js'
import { THEME_INLINE_SCRIPT } from './theme.inline.js'

/**
 * No-op configure wrapper.
 * Quasar's `configure` from `quasar/wrappers` is a TypeScript identity function.
 * We re-export it here so consumer projects don't need `quasar` in their own
 * node_modules just for the config file.
 */
export function configure (callback) {
  return callback
}

/**
 * Resolve the docsector-reader package root.
 *
 * In consumer mode, the package lives in node_modules/@docsector/docsector-reader.
 * In standalone mode (docsector-reader running itself), the package IS the project.
 *
 * Note: We can't use import.meta.dirname here because Quasar's ESM config loader
 * inlines imports, causing import.meta to refer to the config file's context.
 */
function getPackageRoot (projectRoot) {
  // Consumer mode: package installed in node_modules
  const nodeModulesPath = resolve(projectRoot, 'node_modules', '@docsector', 'docsector-reader')
  if (existsSync(resolve(nodeModulesPath, 'package.json'))) {
    return nodeModulesPath
  }

  // Standalone mode: we ARE the project
  return projectRoot
}

/**
 * Normalize paths for cross-platform file matching.
 */
function normalizePathForMatch (path) {
  return String(path || '').replace(/\\/g, '/')
}

const CURRENT_VERSION_KEY = '__current__'

const DOCSECTOR_VIRTUAL_MODULE_IDS = Object.freeze([
  'virtual:docsector-books',
  'virtual:docsector-homepage-override',
  'virtual:docsector-code-examples',
  'virtual:docsector-git-dates',
  'virtual:docsector-icons'
])

const DOCSECTOR_CONSUMER_OPTIMIZE_DEPS_EXCLUDE = Object.freeze([
  '@docsector/docsector-reader',
  '@docsector/docsector-reader/src/App.vue',
  '@docsector/docsector-reader/src/router/index',
  '@docsector/docsector-reader/src/router/index.js',
  '@docsector/docsector-reader/src/router/routes',
  '@docsector/docsector-reader/src/router/routes.js',
  'node_modules/@docsector/docsector-reader/src/App.vue',
  'node_modules/@docsector/docsector-reader/src/router/index',
  'node_modules/@docsector/docsector-reader/src/router/index.js',
  'node_modules/@docsector/docsector-reader/src/router/routes',
  'node_modules/@docsector/docsector-reader/src/router/routes.js',
  ...DOCSECTOR_VIRTUAL_MODULE_IDS
])

function trimSlashes (value) {
  return String(value || '').replace(/^\/+|\/+$/g, '')
}

function normalizeVersionId (value) {
  return String(value || '').trim()
}

function normalizeRoutePrefix (value) {
  const normalized = trimSlashes(value)
  return normalized ? `/${normalized}` : ''
}

function getVersionRoots (projectRoot) {
  const pagesDir = resolve(projectRoot, 'src', 'pages')
  if (!existsSync(pagesDir)) return []

  const roots = [
    {
      versionId: CURRENT_VERSION_KEY,
      current: true,
      rootDir: pagesDir,
      importPrefix: '',
      sourceRoot: '',
      routePrefix: ''
    }
  ]

  const oldDir = resolve(pagesDir, '.old')
  if (!existsSync(oldDir)) return roots

  const oldVersionRoots = readdirSync(oldDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => normalizeVersionId(name).length > 0)
    .sort()

  for (const versionId of oldVersionRoots) {
    roots.push({
      versionId,
      current: false,
      rootDir: resolve(oldDir, versionId),
      importPrefix: `.old/${versionId}/`,
      sourceRoot: `.old/${versionId}`,
      routePrefix: normalizeRoutePrefix(versionId)
    })
  }

  return roots
}

function getPagesRegistryFilesForRoot (root) {
  if (!root || !existsSync(root.rootDir)) return []

  const names = readdirSync(root.rootDir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)

  return names
    .filter(name => {
      if (name === 'index.js') return true
      return /^[^/]+\.book\.js$/.test(name) || /^[^/]+\.index\.js$/.test(name)
    })
    .sort()
    .map(name => resolve(root.rootDir, name))
}

function normalizeBookConfig (rawConfig = {}, fallbackId = 'manual', index = 0) {
  const resolvedId = rawConfig.id || fallbackId || `book-${index + 1}`
  const label = rawConfig.label || (resolvedId.charAt(0).toUpperCase() + resolvedId.slice(1))
  const layouts = rawConfig.layouts ?? rawConfig.layout

  return {
    ...rawConfig,
    id: resolvedId,
    label,
    icon: rawConfig.icon || 'menu_book',
    order: rawConfig.order ?? (index + 1),
    color: normalizeBookColorConfig(rawConfig.color),
    ...(layouts !== undefined ? { layouts } : {})
  }
}

function buildPageRoutePath (entry, subpage, { leadingSlash = false } = {}) {
  const versionPrefix = trimSlashes(entry?.versionPrefix || '')
  const base = trimSlashes(`${entry?.book || 'manual'}${entry?.pagePath || ''}`)
  const routePath = [versionPrefix, base, trimSlashes(subpage)].filter(Boolean).join('/')

  return leadingSlash ? `/${routePath}` : routePath
}

function resolveMarkdownSourceFile (pagesDir, entry, subpage, lang) {
  const sourceRoot = entry?.sourceRoot || ''
  return resolve(pagesDir, sourceRoot, `${entry.book}${entry.pagePath}.${subpage}.${lang}.md`)
}

/**
 * Build the page-content search index of one language: route path (leading
 * slash, no subpage) → lowercased markdown of every enabled subpage. Emitted
 * as `search-index.<lang>.json` and fetched by the sidebar search on demand
 * (see src/search/content-index.js) — with lazy page sources the client no
 * longer holds page markdown in memory to scan.
 */
export function buildSearchContentIndex (pagesDir, pageEntries, lang) {
  const index = {}

  for (const entry of pageEntries) {
    const { page } = entry
    if (page.config === null) continue
    if (page.config.status === 'empty') continue
    if (typeof page.config?.link?.to === 'string' && page.config.link.to.trim().length > 0) continue

    const subpages = ['overview']
    if (page.config.subpages?.showcase) subpages.push('showcase')
    if (page.config.subpages?.vs) subpages.push('vs')

    const parts = []
    for (const subpage of subpages) {
      const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, lang)
      if (!existsSync(srcFile)) continue

      parts.push(readFileSync(srcFile, 'utf-8').toLowerCase())
    }

    if (parts.length === 0) continue

    index[buildPageRoutePath(entry, '', { leadingSlash: true })] = parts.join('\n')
  }

  return index
}

function resolveSearchIndexLangs (config) {
  const defaultLang = config.defaultLanguage || config.languages?.[0]?.value || 'en-US'
  const langs = (config.languages || [])
    .map(language => language?.value)
    .filter(Boolean)

  if (!langs.includes(defaultLang)) {
    langs.unshift(defaultLang)
  }

  return langs
}

/**
 * List top-level page registry definition files.
 *
 * Includes:
 * - src/pages/index.js (legacy)
 * - src/pages/*.book.js
 * - src/pages/*.index.js
 */
function getPagesRegistryFiles (projectRoot) {
  return getVersionRoots(projectRoot)
    .flatMap(root => getPagesRegistryFilesForRoot(root))
}

/**
 * Discover configured books from src/pages/*.book.js paired with *.index.js.
 */
function getBookRegistryEntries (projectRoot) {
  const entries = []
  for (const root of getVersionRoots(projectRoot)) {
    const names = readdirSync(root.rootDir, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)

    const books = names
      .filter(name => /^[^/]+\.book\.js$/.test(name))
      .sort()

    for (const bookFile of books) {
      const baseName = bookFile.slice(0, -'.book.js'.length)
      const indexFile = `${baseName}.index.js`
      if (!names.includes(indexFile)) continue

      entries.push({
        versionId: root.versionId,
        currentVersion: root.current,
        routePrefix: root.routePrefix,
        sourceRoot: root.sourceRoot,
        id: baseName,
        bookFile: `${root.importPrefix}${bookFile}`,
        indexFile: `${root.importPrefix}${indexFile}`,
        bookPath: resolve(root.rootDir, bookFile),
        indexPath: resolve(root.rootDir, indexFile)
      })
    }
  }

  return entries
}

/**
 * Resolve book identifier from page config with legacy fallback support.
 */
function resolvePageBook (config, fallbackBook = 'manual') {
  if (!config || typeof config !== 'object') return fallbackBook
  return config.book ?? config.type ?? fallbackBook
}

function normalizePagePath (pagePath) {
  const normalized = String(pagePath || '').trim()
  if (normalized === '') return ''
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function extractTagsFromRoutes (routes = {}, fallbackBook = 'manual') {
  const extracted = {}

  for (const [pagePath, page] of Object.entries(routes || {})) {
    if (!page || typeof page !== 'object') continue

    const metadata = page.metadata
    if (!metadata || typeof metadata !== 'object') continue

    const pageTags = metadata.tags
    if (!pageTags || typeof pageTags !== 'object' || Array.isArray(pageTags)) continue

    const bookName = resolvePageBook(page.config, fallbackBook)
    const normalizedPath = normalizePagePath(pagePath)
    const unversionedPath = `/${bookName}${normalizedPath}`

    for (const [locale, terms] of Object.entries(pageTags)) {
      if (typeof terms !== 'string' || terms.trim().length === 0) continue

      if (!extracted[locale]) {
        extracted[locale] = {}
      }

      extracted[locale][unversionedPath] = terms
    }
  }

  return extracted
}

function mergeBookTags (legacyTags = {}, metadataTags = {}) {
  const merged = {}
  const locales = new Set([
    ...Object.keys(legacyTags || {}),
    ...Object.keys(metadataTags || {})
  ])

  for (const locale of locales) {
    merged[locale] = {
      ...(legacyTags?.[locale] || {}),
      ...(metadataTags?.[locale] || {})
    }
  }

  return merged
}

const DEFAULT_BOOK_COLORS = Object.freeze({
  active: 'white',
  inactive: 'rgba(255, 255, 255, 0.72)'
})

function normalizeBookColorConfig (rawColor) {
  if (typeof rawColor === 'object' && rawColor !== null && !Array.isArray(rawColor)) {
    const active = typeof rawColor.active === 'string' && rawColor.active.trim().length > 0
      ? rawColor.active.trim()
      : DEFAULT_BOOK_COLORS.active

    const inactive = typeof rawColor.inactive === 'string' && rawColor.inactive.trim().length > 0
      ? rawColor.inactive.trim()
      : active

    return { active, inactive }
  }

  if (typeof rawColor === 'string' && rawColor.trim().length > 0) {
    const normalized = rawColor.trim()
    return {
      active: normalized,
      inactive: normalized
    }
  }

  return { ...DEFAULT_BOOK_COLORS }
}

/**
 * Build source code for the virtual module `virtual:docsector-books`.
 */
function buildVirtualBooksModule (projectRoot) {
  const bookEntries = getBookRegistryEntries(projectRoot)

  // Legacy fallback: support projects that still define src/pages/index.js only.
  if (bookEntries.length === 0) {
    return `import docsectorConfig from 'docsector.config.js'
import legacyPages from 'pages'

const CURRENT_VERSION_KEY = ${JSON.stringify(CURRENT_VERSION_KEY)}

const normalizeVersionBadge = (rawBadge, { released, releaseStatus }) => {
  const normalizedStatus = String(releaseStatus || '').toLowerCase()
  const deprecated = normalizedStatus === 'deprecated'
  const defaultColor = deprecated ? 'negative' : (released ? 'positive' : 'warning')
  const defaultTextColor = (deprecated || released) ? 'white' : 'dark'

  if (rawBadge === false || rawBadge === null) {
    return { label: releaseStatus, color: defaultColor, textColor: defaultTextColor }
  }

  if (typeof rawBadge === 'string') {
    return { label: rawBadge, color: defaultColor, textColor: defaultTextColor }
  }

  if (typeof rawBadge === 'object' && rawBadge !== null) {
    const label = rawBadge.label || rawBadge.text || releaseStatus
    if (!label) {
      return null
    }

    return {
      ...rawBadge,
      label,
      color: rawBadge.color || defaultColor,
      textColor: rawBadge.textColor || defaultTextColor
    }
  }

  return { label: releaseStatus || (released ? 'released' : 'draft'), color: defaultColor, textColor: defaultTextColor }
}

const normalizeVersionDescriptor = (raw, fallback = {}) => {
  const value = typeof raw === 'string' ? { id: raw, label: raw } : (raw || {})
  const current = value.current === true || fallback.current === true
  const id = current
    ? (value.id || docsectorConfig.branding?.version || fallback.id || 'current')
    : (value.id || fallback.id || value.label || '')
  const label = value.label || id
  const normalizedPrefix = String(value.routePrefix || fallback.routePrefix || id || '').replace(/^\\/+|\\/+$/g, '')
  const configuredStatus = value.deprecated === true || fallback.deprecated === true
    ? 'deprecated'
    : (value.releaseStatus || value.status || fallback.releaseStatus || fallback.status)
  const explicitlyReleased = value.released !== undefined
    ? value.released !== false
    : (fallback.released !== undefined ? fallback.released !== false : null)
  const released = configuredStatus === 'deprecated'
    ? true
    : (explicitlyReleased ?? !['draft', 'unreleased', 'preview', 'next'].includes(String(configuredStatus || '').toLowerCase()))
  const releaseStatus = configuredStatus || (released ? 'released' : 'draft')
  const badge = normalizeVersionBadge(value.badge ?? value.releaseBadge ?? fallback.badge ?? fallback.releaseBadge, { released, releaseStatus })

  return {
    ...fallback,
    ...value,
    id,
    label,
    released,
    releaseStatus,
    deprecated: releaseStatus === 'deprecated',
    badge,
    current,
    routePrefix: current ? '' : (normalizedPrefix ? '/' + normalizedPrefix : ''),
    sourceRoot: current ? '' : (value.sourceRoot || fallback.sourceRoot || (id ? '.old/' + id : ''))
  }
}

const discoveredVersions = [
  normalizeVersionDescriptor(null, { id: CURRENT_VERSION_KEY, current: true })
]

const configuredVersions = Array.isArray(docsectorConfig.branding?.versions) ? docsectorConfig.branding.versions : []
const currentVersion = normalizeVersionDescriptor(
  configuredVersions.find(version => typeof version === 'object' && version?.current === true),
  { id: docsectorConfig.branding?.version || CURRENT_VERSION_KEY, current: true }
)

export const versions = [currentVersion]

export const versionById = versions.reduce((accumulator, version) => {
  accumulator[version.id] = version
  return accumulator
}, {})

const defaultBook = {
  id: 'manual',
  label: 'Manual',
  icon: 'menu_book',
  order: 1,
  color: {
    active: 'white',
    inactive: 'rgba(255, 255, 255, 0.72)'
  }
}

const normalizedPages = legacyPages || {}

export const booksByVersion = {
  [currentVersion.id]: {
    version: currentVersion,
    books: {
      manual: {
        config: defaultBook,
        routes: normalizedPages,
        tags: {}
      }
    },
    allBooks: [defaultBook]
  }
}

export const books = booksByVersion[currentVersion.id].books
export const bookTagsByVersion = {
  [currentVersion.id]: {
    manual: {}
  }
}
export const bookTags = bookTagsByVersion[currentVersion.id]

export const pageEntries = Object.entries(normalizedPages).map(([pagePath, page]) => ({
  version: currentVersion.id,
  versionLabel: currentVersion.label,
  versionCurrent: true,
  versionPrefix: '',
  sourceRoot: '',
  book: page?.config?.book ?? page?.config?.type ?? 'manual',
  bookConfig: defaultBook,
  pagePath,
  page
}))

export const allBooks = [defaultBook]
export const allPages = normalizedPages

export default books
`
  }

  const imports = ['import docsectorConfig from \'docsector.config.js\'']
  const rows = []
  const discoveredVersionIds = new Map()

  for (const [index, entry] of bookEntries.entries()) {
    imports.push(`import __book_${index} from 'pages/${entry.bookFile}'`)
    imports.push(`import * as __index_${index} from 'pages/${entry.indexFile}'`)
    rows.push(`  { versionId: ${JSON.stringify(entry.versionId)}, currentVersion: ${JSON.stringify(entry.currentVersion)}, routePrefix: ${JSON.stringify(entry.routePrefix)}, sourceRoot: ${JSON.stringify(entry.sourceRoot)}, fallbackId: ${JSON.stringify(entry.id)}, config: __book_${index}, routes: __index_${index}.default || {}, legacyTags: __index_${index}.tags || {} }`)
    discoveredVersionIds.set(entry.versionId, {
      id: entry.versionId,
      current: entry.currentVersion,
      routePrefix: entry.routePrefix,
      sourceRoot: entry.sourceRoot
    })
  }

  const discoveredVersions = Array.from(discoveredVersionIds.values())

  return `${imports.join('\n')}

const CURRENT_VERSION_KEY = ${JSON.stringify(CURRENT_VERSION_KEY)}

const discoveredVersions = ${JSON.stringify(discoveredVersions, null, 2)}

const entries = [
${rows.join(',\n')}
]

const DEFAULT_BOOK_COLORS = Object.freeze({
  active: 'white',
  inactive: 'rgba(255, 255, 255, 0.72)'
})

const normalizeVersionBadge = (rawBadge, { released, releaseStatus }) => {
  const normalizedStatus = String(releaseStatus || '').toLowerCase()
  const deprecated = normalizedStatus === 'deprecated'
  const defaultColor = deprecated ? 'negative' : (released ? 'positive' : 'warning')
  const defaultTextColor = (deprecated || released) ? 'white' : 'dark'

  if (rawBadge === false || rawBadge === null) {
    return { label: releaseStatus, color: defaultColor, textColor: defaultTextColor }
  }

  if (typeof rawBadge === 'string') {
    return { label: rawBadge, color: defaultColor, textColor: defaultTextColor }
  }

  if (typeof rawBadge === 'object' && rawBadge !== null) {
    const label = rawBadge.label || rawBadge.text || releaseStatus
    if (!label) {
      return null
    }

    return {
      ...rawBadge,
      label,
      color: rawBadge.color || defaultColor,
      textColor: rawBadge.textColor || defaultTextColor
    }
  }

  return { label: releaseStatus || (released ? 'released' : 'draft'), color: defaultColor, textColor: defaultTextColor }
}

const trimSlashes = (value) => String(value || '').replace(/^\\/+|\\/+$/g, '')

const normalizeBookColor = (rawColor) => {
  if (typeof rawColor === 'object' && rawColor !== null && !Array.isArray(rawColor)) {
    const active = typeof rawColor.active === 'string' && rawColor.active.trim().length > 0
      ? rawColor.active.trim()
      : DEFAULT_BOOK_COLORS.active

    const inactive = typeof rawColor.inactive === 'string' && rawColor.inactive.trim().length > 0
      ? rawColor.inactive.trim()
      : active

    return { active, inactive }
  }

  if (typeof rawColor === 'string' && rawColor.trim().length > 0) {
    const normalized = rawColor.trim()
    return {
      active: normalized,
      inactive: normalized
    }
  }

  return { ...DEFAULT_BOOK_COLORS }
}

const resolvePageBook = (config, fallbackBook = 'manual') => {
  if (!config || typeof config !== 'object') return fallbackBook
  return config.book ?? config.type ?? fallbackBook
}

const normalizePagePath = (pagePath) => {
  const normalized = String(pagePath || '').trim()
  if (normalized === '') return ''
  return normalized.startsWith('/') ? normalized : '/' + normalized
}

const extractTagsFromRoutes = (routes = {}, fallbackBook = 'manual') => {
  const extracted = {}

  for (const [pagePath, page] of Object.entries(routes || {})) {
    if (!page || typeof page !== 'object') continue

    const metadata = page.metadata
    if (!metadata || typeof metadata !== 'object') continue

    const pageTags = metadata.tags
    if (!pageTags || typeof pageTags !== 'object' || Array.isArray(pageTags)) continue

    const bookName = resolvePageBook(page.config, fallbackBook)
    const normalizedPath = normalizePagePath(pagePath)
    const unversionedPath = '/' + bookName + normalizedPath

    for (const [locale, terms] of Object.entries(pageTags)) {
      if (typeof terms !== 'string' || terms.trim().length === 0) continue

      if (!extracted[locale]) {
        extracted[locale] = {}
      }

      extracted[locale][unversionedPath] = terms
    }
  }

  return extracted
}

const mergeBookTags = (legacyTags = {}, metadataTags = {}) => {
  const merged = {}
  const locales = new Set([
    ...Object.keys(legacyTags || {}),
    ...Object.keys(metadataTags || {})
  ])

  for (const locale of locales) {
    merged[locale] = {
      ...(legacyTags?.[locale] || {}),
      ...(metadataTags?.[locale] || {})
    }
  }

  return merged
}

const normalizeVersionDescriptor = (raw, fallback = {}) => {
  const value = typeof raw === 'string' ? { id: raw, label: raw } : (raw || {})
  const current = value.current === true || fallback.current === true
  const id = current
    ? (value.id || docsectorConfig.branding?.version || fallback.id || 'current')
    : (value.id || fallback.id || value.label || '')
  const label = value.label || id
  const prefixSource = value.routePrefix ?? fallback.routePrefix ?? id
  const normalizedPrefix = trimSlashes(prefixSource)
  const configuredStatus = value.deprecated === true || fallback.deprecated === true
    ? 'deprecated'
    : (value.releaseStatus || value.status || fallback.releaseStatus || fallback.status)
  const explicitlyReleased = value.released !== undefined
    ? value.released !== false
    : (fallback.released !== undefined ? fallback.released !== false : null)
  const released = configuredStatus === 'deprecated'
    ? true
    : (explicitlyReleased ?? !['draft', 'unreleased', 'preview', 'next'].includes(String(configuredStatus || '').toLowerCase()))
  const releaseStatus = configuredStatus || (released ? 'released' : 'draft')
  const badge = normalizeVersionBadge(value.badge ?? value.releaseBadge ?? fallback.badge ?? fallback.releaseBadge, { released, releaseStatus })

  return {
    ...fallback,
    ...value,
    id,
    label,
    released,
    releaseStatus,
    deprecated: releaseStatus === 'deprecated',
    badge,
    current,
    routePrefix: current ? '' : (normalizedPrefix ? '/' + normalizedPrefix : ''),
    sourceRoot: current ? '' : (value.sourceRoot || fallback.sourceRoot || (id ? '.old/' + id : ''))
  }
}

const configuredVersions = Array.isArray(docsectorConfig.branding?.versions) ? docsectorConfig.branding.versions : []
const currentVersion = normalizeVersionDescriptor(
  configuredVersions.find(version => typeof version === 'object' && version?.current === true),
  { id: docsectorConfig.branding?.version || CURRENT_VERSION_KEY, current: true }
)

const configuredVersionDescriptors = configuredVersions
  .filter(version => !(typeof version === 'object' && version?.current === true))
  .map(version => {
    const value = typeof version === 'string' ? { id: version, label: version } : version
    const discovered = discoveredVersions.find(item => item.id === value?.id || item.id === value?.label) || {}
    const isCurrent = value?.id === currentVersion.id || value?.label === currentVersion.id

    return normalizeVersionDescriptor(value, isCurrent ? { ...currentVersion, current: true } : discovered)
  })

export const versions = [currentVersion]

for (const version of configuredVersionDescriptors) {
  if (!versions.some(item => item.id === version.id)) {
    versions.push(version)
  }
}

for (const discovered of discoveredVersions) {
  if (discovered.current) continue
  if (!versions.some(item => item.id === discovered.id)) {
    versions.push(normalizeVersionDescriptor(null, discovered))
  }
}

export const versionById = versions.reduce((accumulator, version) => {
  accumulator[version.id] = version
  return accumulator
}, {})

const resolveEntryVersion = (entry) => {
  if (entry.currentVersion === true || entry.versionId === CURRENT_VERSION_KEY) {
    return currentVersion
  }

  return versionById[entry.versionId] || normalizeVersionDescriptor(null, {
    id: entry.versionId,
    current: false,
    routePrefix: entry.routePrefix,
    sourceRoot: entry.sourceRoot
  })
}

export const booksByVersion = entries.reduce((accumulator, entry, index) => {
  const version = resolveEntryVersion(entry)
  const config = entry.config || {}
  const resolvedId = config.id || entry.fallbackId || ('book-' + (index + 1))
  const metadataTags = extractTagsFromRoutes(entry.routes || {}, resolvedId)
  const tags = mergeBookTags(entry.legacyTags || {}, metadataTags)
  const label = config.label || (resolvedId.charAt(0).toUpperCase() + resolvedId.slice(1))
  const normalizedConfig = {
    ...config,
    id: resolvedId,
    label,
    icon: config.icon || 'menu_book',
    order: config.order ?? (index + 1),
    color: normalizeBookColor(config.color),
    ...(config.layouts !== undefined || config.layout !== undefined ? { layouts: config.layouts ?? config.layout } : {}),
    version: version.id,
    versionPrefix: version.routePrefix
  }

  if (!accumulator[version.id]) {
    accumulator[version.id] = {
      version,
      books: {},
      allBooks: []
    }
  }

  accumulator[version.id].books[resolvedId] = {
    config: normalizedConfig,
    routes: entry.routes || {},
    tags
  }
  accumulator[version.id].allBooks = Object.values(accumulator[version.id].books).map(book => book.config)
  return accumulator
}, {})

export const books = booksByVersion[currentVersion.id]?.books || {}

export const allBooks = booksByVersion[currentVersion.id]?.allBooks || []
export const allPages = Object.values(books).reduce((accumulator, book) => {
  return {
    ...accumulator,
    ...(book.routes || {})
  }
}, {})

export const bookTagsByVersion = Object.entries(booksByVersion).reduce((accumulator, [versionId, versionBooks]) => {
  accumulator[versionId] = Object.entries(versionBooks?.books || {}).reduce((bookAccumulator, [bookId, book]) => {
    bookAccumulator[bookId] = book?.tags || {}
    return bookAccumulator
  }, {})
  return accumulator
}, {})

export const bookTags = bookTagsByVersion[currentVersion.id] || {}

export const pageEntries = Object.entries(booksByVersion).flatMap(([versionId, versionBooks]) => {
  const version = versionBooks.version

  return Object.entries(versionBooks.books || {}).flatMap(([bookId, book]) => {
    const fallbackBook = book?.config?.id || bookId || 'manual'

    return Object.entries(book?.routes || {}).map(([pagePath, page]) => {
      const bookName = page?.config?.book ?? page?.config?.type ?? fallbackBook
      const pathSegments = String(pagePath || '').replace(/^\\//, '').split('/').filter(Boolean)
      const i18nSegments = version.current ? [bookName, ...pathSegments] : [version.id, bookName, ...pathSegments]

      return {
        version: versionId,
        versionLabel: version.label,
        versionCurrent: version.current,
        versionPrefix: version.routePrefix,
        sourceRoot: version.sourceRoot || '',
        book: bookName,
        bookConfig: book.config,
        pagePath,
        page,
        i18nSegments,
        unversionedPath: '/' + bookName + pagePath
      }
    })
  })
})

export default books
`
}

/**
 * Load books and merged pages for build-time plugins (Node context).
 */
export async function loadBooksRegistry (projectRoot) {
  const entries = getBookRegistryEntries(projectRoot)

  // Legacy fallback
  if (entries.length === 0) {
    const configPath = resolve(projectRoot, 'docsector.config.js')
    const { default: config = {} } = existsSync(configPath)
      ? await import(pathToFileURL(configPath).href)
      : { default: {} }
    const currentVersion = {
      id: config.branding?.version || 'current',
      label: config.branding?.version || 'current',
      current: true,
      routePrefix: '',
      sourceRoot: ''
    }
    const legacyPath = resolve(projectRoot, 'src', 'pages', 'index.js')
    const pages = existsSync(legacyPath)
      ? ((await import(pathToFileURL(legacyPath).href)).default || {})
      : {}

    const defaultBook = {
      id: 'manual',
      label: 'Manual',
      icon: 'menu_book',
      order: 1,
      color: {
        active: 'white',
        inactive: 'rgba(255, 255, 255, 0.72)'
      },
      version: currentVersion.id,
      versionPrefix: ''
    }

    const books = {
      manual: {
        config: defaultBook,
        routes: pages
      }
    }

    const pageEntries = getBookPageEntries({
      [currentVersion.id]: {
        version: currentVersion,
        books
      }
    })

    return {
      versions: [currentVersion],
      booksByVersion: {
        [currentVersion.id]: {
          version: currentVersion,
          books,
          allBooks: [defaultBook]
        }
      },
      bookTagsByVersion: {
        [currentVersion.id]: {
          manual: {}
        }
      },
      bookTags: {
        manual: {}
      },
      pageEntries,
      books,
      allBooks: [defaultBook],
      allPages: pages
    }
  }

  const configPath = resolve(projectRoot, 'docsector.config.js')
  const { default: config = {} } = existsSync(configPath)
    ? await import(pathToFileURL(configPath).href)
    : { default: {} }

  const discoveredVersions = Array.from(new Map(entries.map(entry => [entry.versionId, {
    id: entry.versionId,
    current: entry.currentVersion,
    routePrefix: entry.routePrefix,
    sourceRoot: entry.sourceRoot
  }])).values())

  const normalizeVersionBadge = (rawBadge, { released, releaseStatus }) => {
    const normalizedStatus = String(releaseStatus || '').toLowerCase()
    const deprecated = normalizedStatus === 'deprecated'
    const defaultColor = deprecated ? 'negative' : (released ? 'positive' : 'warning')
    const defaultTextColor = (deprecated || released) ? 'white' : 'dark'

    if (rawBadge === false || rawBadge === null) {
      return { label: releaseStatus, color: defaultColor, textColor: defaultTextColor }
    }

    if (typeof rawBadge === 'string') {
      return { label: rawBadge, color: defaultColor, textColor: defaultTextColor }
    }

    if (typeof rawBadge === 'object' && rawBadge !== null) {
      const label = rawBadge.label || rawBadge.text || releaseStatus
      if (!label) {
        return null
      }

      return {
        ...rawBadge,
        label,
        color: rawBadge.color || defaultColor,
        textColor: rawBadge.textColor || defaultTextColor
      }
    }

    return { label: releaseStatus || (released ? 'released' : 'draft'), color: defaultColor, textColor: defaultTextColor }
  }

  const normalizeVersionDescriptor = (raw, fallback = {}) => {
    const value = typeof raw === 'string' ? { id: raw, label: raw } : (raw || {})
    const current = value.current === true || fallback.current === true
    const id = current
      ? (value.id || config.branding?.version || fallback.id || 'current')
      : (value.id || fallback.id || value.label || '')
    const label = value.label || id
    const prefixSource = value.routePrefix ?? fallback.routePrefix ?? id
    const normalizedPrefix = trimSlashes(prefixSource)
    const configuredStatus = value.deprecated === true || fallback.deprecated === true
      ? 'deprecated'
      : (value.releaseStatus || value.status || fallback.releaseStatus || fallback.status)
    const explicitlyReleased = value.released !== undefined
      ? value.released !== false
      : (fallback.released !== undefined ? fallback.released !== false : null)
    const released = configuredStatus === 'deprecated'
      ? true
      : (explicitlyReleased ?? !['draft', 'unreleased', 'preview', 'next'].includes(String(configuredStatus || '').toLowerCase()))
    const releaseStatus = configuredStatus || (released ? 'released' : 'draft')
    const badge = normalizeVersionBadge(value.badge ?? value.releaseBadge ?? fallback.badge ?? fallback.releaseBadge, { released, releaseStatus })

    return {
      ...fallback,
      ...value,
      id,
      label,
      released,
      releaseStatus,
      deprecated: releaseStatus === 'deprecated',
      badge,
      current,
      routePrefix: current ? '' : (normalizedPrefix ? `/${normalizedPrefix}` : ''),
      sourceRoot: current ? '' : (value.sourceRoot || fallback.sourceRoot || (id ? `.old/${id}` : ''))
    }
  }

  const configuredVersions = Array.isArray(config.branding?.versions) ? config.branding.versions : []
  const currentVersion = normalizeVersionDescriptor(
    configuredVersions.find(version => typeof version === 'object' && version?.current === true),
    { id: config.branding?.version || CURRENT_VERSION_KEY, current: true }
  )
  const versions = [currentVersion]

  for (const configured of configuredVersions) {
    if (typeof configured === 'object' && configured?.current === true) continue

    const value = typeof configured === 'string' ? { id: configured, label: configured } : configured
    const discovered = discoveredVersions.find(item => item.id === value?.id || item.id === value?.label) || {}
    const isCurrent = value?.id === currentVersion.id || value?.label === currentVersion.id
    const version = normalizeVersionDescriptor(value, isCurrent ? { ...currentVersion, current: true } : discovered)

    if (!versions.some(item => item.id === version.id)) {
      versions.push(version)
    }
  }

  for (const discovered of discoveredVersions) {
    if (discovered.current) continue
    if (!versions.some(item => item.id === discovered.id)) {
      versions.push(normalizeVersionDescriptor(null, discovered))
    }
  }

  const versionById = versions.reduce((accumulator, version) => {
    accumulator[version.id] = version
    return accumulator
  }, {})

  const booksByVersion = {}
  const currentBooks = {}
  const allPages = {}
  const bookTagsByVersion = {}

  for (const [index, entry] of entries.entries()) {
    const rawVersion = entry.currentVersion || entry.versionId === CURRENT_VERSION_KEY
      ? currentVersion
      : (versionById[entry.versionId] || normalizeVersionDescriptor(null, entry))
    const { default: rawConfig = {} } = await import(pathToFileURL(entry.bookPath).href)
    const { default: routes = {}, tags: legacyTags = {} } = await import(pathToFileURL(entry.indexPath).href)

    const config = {
      ...normalizeBookConfig(rawConfig, entry.id, index),
      version: rawVersion.id,
      versionPrefix: rawVersion.routePrefix
    }
    const tags = mergeBookTags(legacyTags, extractTagsFromRoutes(routes, config.id))

    if (!booksByVersion[rawVersion.id]) {
      booksByVersion[rawVersion.id] = {
        version: rawVersion,
        books: {},
        allBooks: []
      }
    }

    booksByVersion[rawVersion.id].books[config.id] = {
      config,
      routes,
      tags
    }

    if (!bookTagsByVersion[rawVersion.id]) {
      bookTagsByVersion[rawVersion.id] = {}
    }
    bookTagsByVersion[rawVersion.id][config.id] = tags || {}

    if (rawVersion.current) {
      currentBooks[config.id] = {
        config,
        routes,
        tags
      }
      Object.assign(allPages, routes || {})
    }
  }

  for (const versionBooks of Object.values(booksByVersion)) {
    versionBooks.allBooks = Object.values(versionBooks.books).map(book => book.config)
  }

  const allBooks = Object.values(currentBooks).map(book => book.config)
  const pageEntries = getBookPageEntries(booksByVersion)

  return {
    versions,
    booksByVersion,
    bookTagsByVersion,
    bookTags: bookTagsByVersion[currentVersion.id] || {},
    pageEntries,
    books: currentBooks,
    allBooks,
    allPages
  }
}

/**
 * Return page entries while preserving the book that contributed each route.
 *
 * Why: `allPages` is a legacy flattened registry and cannot represent two
 * books that reuse the same route key, such as `/getting-started` in both
 * `guide.index.js` and `manual.index.js`. Build artifacts that need concrete
 * URLs must iterate per book instead.
 */
function getBookPageEntries (booksByVersion = {}) {
  const pageEntries = []

  for (const [versionId, versionBooks] of Object.entries(booksByVersion || {})) {
    const version = versionBooks?.version || {
      id: versionId,
      label: versionId,
      current: true,
      routePrefix: '',
      sourceRoot: ''
    }

    for (const [bookId, book] of Object.entries(versionBooks?.books || {})) {
      const fallbackBook = book?.config?.id || bookId || 'manual'

      for (const [pagePath, page] of Object.entries(book?.routes || {})) {
        const bookName = resolvePageBook(page?.config, fallbackBook)
        const pathSegments = String(pagePath || '').replace(/^\//, '').split('/').filter(Boolean)

        pageEntries.push({
          version: version.id,
          versionLabel: version.label || version.id,
          versionCurrent: version.current === true,
          versionPrefix: version.routePrefix || '',
          sourceRoot: version.sourceRoot || '',
          book: bookName,
          bookConfig: book.config,
          pagePath,
          page,
          i18nSegments: version.current === true ? [bookName, ...pathSegments] : [version.id, bookName, ...pathSegments],
          unversionedPath: `/${bookName}${pagePath}`
        })
      }
    }
  }

  return pageEntries
}

/**
 * Check if a file path is a book registry definition file.
 */
function isPagesRegistryFile (projectRoot, changedPath) {
  const pagesDir = normalizePathForMatch(resolve(projectRoot, 'src', 'pages'))
  const normalizedPath = normalizePathForMatch(changedPath)
  const prefix = `${pagesDir}/`

  if (!normalizedPath.startsWith(prefix)) return false
  const relativePath = normalizedPath.slice(prefix.length)

  if (relativePath === 'index.js') return true
  if (/^[^/]+\.book\.js$/.test(relativePath) || /^[^/]+\.index\.js$/.test(relativePath)) {
    return true
  }

  return /^\.old\/[^/]+\/(?:index\.js|[^/]+\.book\.js|[^/]+\.index\.js)$/.test(relativePath)
}

/**
 * Create a Vite plugin that exposes discovered books through
 * `virtual:docsector-books` and restarts dev server when definitions change.
 *
 * Why: The router module (`routes.js`) imports consumer content via the
 * `pages` alias. Vite's dep optimizer pre-bundles the router with the
 * consumer content inlined, but the optimizer cache hash is based on config
 * and lockfile only — NOT on consumer source files. So when page registries
 * change during development, the optimizer can serve stale pre-bundled code.
 */
function createBooksPlugin (projectRoot) {
  const virtualId = 'virtual:docsector-books'
  const resolvedId = '\0' + virtualId

  return {
    name: 'docsector-books',
    resolveId (id) {
      if (id === virtualId) return resolvedId
    },
    load (id) {
      if (id !== resolvedId) return null
      return buildVirtualBooksModule(projectRoot)
    },
    configureServer (server) {
      const onPagesRegistryChange = (changedPath) => {
        if (isPagesRegistryFile(projectRoot, changedPath)) {
          server.config.logger.info(
            `\\x1b[36m[docsector]\\x1b[0m pages registry changed (${changedPath}) — clearing dep cache and restarting...`,
            { timestamp: true }
          )

          // Invalidate virtual module before restart
          const module = server.moduleGraph.getModuleById(resolvedId)
          if (module) {
            server.moduleGraph.invalidateModule(module)
          }

          // Signal the restarted config to force a new optimizer hash
          process.env.__DOCSECTOR_FORCE_OPTIMIZE = '1'
          // Delete the stale optimizer cache
          const cacheDir = resolve(projectRoot, 'node_modules', '.q-cache')
          rmSync(cacheDir, { recursive: true, force: true })
          server.restart()
        }
      }

      server.watcher.on('add', onPagesRegistryChange)
      server.watcher.on('change', onPagesRegistryChange)
      server.watcher.on('unlink', onPagesRegistryChange)
    }
  }
}

function buildVirtualCodeExamplesModule () {
  return `const componentModules = import.meta.glob('/src/examples/**/*.vue')
const sourceModules = import.meta.glob('/src/examples/**/*.vue', { query: '?raw', import: 'default' })

const trimSlashes = (value) => String(value || '').replace(/\\\\/g, '/').replace(/^\\/+|\\/+$/g, '')
const toKebabSegment = (value) => String(value || '')
  .replace(/\\.vue$/i, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[\\s_]+/g, '-')
  .replace(/-+/g, '-')
  .toLowerCase()

export const normalizeCodeExampleId = (value) => trimSlashes(value)
  .replace(/^src\\/examples\\//i, '')
  .replace(/^examples\\//i, '')
  .replace(/\\.vue$/i, '')
  .split('/')
  .filter(Boolean)
  .map(toKebabSegment)
  .join('/')

export const codeExamples = Object.keys(componentModules).reduce((examples, filePath) => {
  const id = normalizeCodeExampleId(filePath)

  examples[id] = {
    id,
    filePath,
    loadComponent: componentModules[filePath],
    loadSource: sourceModules[filePath]
  }

  return examples
}, {})

export const codeExampleIds = Object.keys(codeExamples).sort()

export const resolveCodeExample = (value) => {
  const id = normalizeCodeExampleId(value)
  const entry = codeExamples[id]

  if (!entry) {
    return {
      id,
      filePath: '',
      exists: false,
      loadComponent: null,
      loadSource: null
    }
  }

  return {
    ...entry,
    exists: true
  }
}

export default codeExamples
`
}

function createCodeExamplesPlugin () {
  const virtualId = 'virtual:docsector-code-examples'
  const resolvedId = '\0' + virtualId

  return {
    name: 'docsector-code-examples',
    resolveId (id) {
      if (id === virtualId) return resolvedId
    },
    load (id) {
      if (id !== resolvedId) return null
      return buildVirtualCodeExamplesModule()
    }
  }
}

function buildVirtualTerminalsModule () {
  return `const engineModules = import.meta.glob(['/src/terminals/**/*.js', '!**/*.worker.js'])

const trimSlashes = (value) => String(value || '').replace(/\\\\/g, '/').replace(/^\\/+|\\/+$/g, '')
const toKebabSegment = (value) => String(value || '')
  .replace(/\\.js$/i, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[\\s_]+/g, '-')
  .replace(/-+/g, '-')
  .toLowerCase()

export const normalizeTerminalEngineId = (value) => trimSlashes(value)
  .replace(/^src\\/terminals\\//i, '')
  .replace(/^terminals\\//i, '')
  .replace(/\\.js$/i, '')
  .split('/')
  .filter(Boolean)
  .map(toKebabSegment)
  .join('/')

export const terminalEngines = Object.keys(engineModules).reduce((engines, filePath) => {
  const id = normalizeTerminalEngineId(filePath)

  engines[id] = {
    id,
    filePath,
    loadEngine: engineModules[filePath]
  }

  return engines
}, {})

export const terminalEngineIds = Object.keys(terminalEngines).sort()

export const resolveTerminalEngine = (value) => {
  const id = normalizeTerminalEngineId(value)
  const entry = terminalEngines[id]

  if (!entry) {
    return {
      id,
      filePath: '',
      exists: false,
      loadEngine: null
    }
  }

  return {
    ...entry,
    exists: true
  }
}

export default terminalEngines
`
}

function createTerminalsPlugin () {
  const virtualId = 'virtual:docsector-terminals'
  const resolvedId = '\0' + virtualId

  return {
    name: 'docsector-terminals',
    resolveId (id) {
      if (id === virtualId) return resolvedId
    },
    load (id) {
      if (id !== resolvedId) return null
      return buildVirtualTerminalsModule()
    }
  }
}

/**
 * Create the HJSON Vite plugin for loading .hjson files as ES modules.
 */
function createHjsonPlugin () {
  return {
    name: 'vite-plugin-hjson',
    transform (code, id) {
      if (id.endsWith('.hjson')) {
        const parsed = HJSON.parse(readFileSync(id, 'utf-8'))
        return {
          code: `export default ${JSON.stringify(parsed, null, 2)};`,
          map: null
        }
      }
    }
  }
}

/**
 * Create a Vite plugin that pre-renders route-specific index.html files at build
 * time with correct <title> and Open Graph / Twitter Card meta tags.
 *
 * Why: SPA builds produce a single index.html with a generic title. Search engine
 * crawlers and social media link previews read the static HTML without executing
 * JavaScript, so they always see the same generic meta tags regardless of the URL.
 *
 * How: After Vite writes the bundle (closeBundle hook), the plugin dynamically
 * imports the consumer's pages registry and docsector config, then for each route
 * creates a directory with an index.html copy whose <title> and meta tags reflect
 * the page's actual title. Cloudflare Pages (and any static host) serves these
 * route-specific files automatically.
 *
 * Zero external dependencies — no Puppeteer or headless browser required.
 */
function createPrerenderMetaPlugin (projectRoot) {
  // Chunk graph captured at generateBundle time. closeBundle uses it to
  // inject route-specific modulepreload links into each pre-rendered HTML:
  // a direct page hit then downloads the boot chunks, DSubpage and that
  // route's markdown chunks in parallel with the entry, collapsing the
  // three sequential discovery waves of a cold SPA load into one.
  const chunkByFacade = new Map()
  const chunkImports = new Map()
  const chunkCss = new Map()

  return {
    name: 'docsector-prerender-meta',
    apply: 'build',

    generateBundle (_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue

        if (chunk.facadeModuleId) {
          chunkByFacade.set(chunk.facadeModuleId.split('?')[0], chunk.fileName)
        }
        chunkImports.set(chunk.fileName, chunk.imports || [])
        chunkCss.set(chunk.fileName, [...(chunk.viteMetadata?.importedCss || [])])
      }
    },

    async closeBundle () {
      const distDir = resolve(projectRoot, 'dist', 'spa')
      const baseHtmlPath = resolve(distDir, 'index.html')
      if (!existsSync(baseHtmlPath)) return

      const baseHtml = readFileSync(baseHtmlPath, 'utf-8')

      // Dynamic import books registry and docsector config
      const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href

      const { pageEntries } = await loadBooksRegistry(projectRoot)
      const { default: config } = await import(configUrl)

      const brandingName = config.branding?.name || ''
      const brandingLogo = config.branding?.logo || ''
      const defaultLang = config.defaultLanguage || config.languages?.[0]?.value || 'en-US'

      const resolveLocalizedValue = (source) => {
        if (!source) return ''
        if (typeof source === 'string') return source
        if (typeof source === 'object') {
          return source[defaultLang] || source['*'] || source['en-US'] || Object.values(source)[0] || ''
        }
        return ''
      }

      // ! Preload computation — shared graph (boot + DSubpage) and per-route
      //   markdown chunks, minus everything the base index.html already loads
      const alreadyLoaded = new Set()
      for (const match of baseHtml.matchAll(/(?:href|src)="\/([^"]+\.js)"/g)) {
        alreadyLoaded.add(match[1])
      }
      const baseCss = new Set(
        [...baseHtml.matchAll(/href="\/([^"]+\.css)"/g)].map(match => match[1])
      )

      const findChunk = (suffix) => {
        for (const [facade, fileName] of chunkByFacade) {
          if (facade.endsWith(suffix)) return fileName
        }
        return null
      }

      const collectGraph = (fileName, into) => {
        if (!fileName || alreadyLoaded.has(fileName) || into.includes(fileName)) return

        into.push(fileName)
        for (const imported of chunkImports.get(fileName) || []) {
          collectGraph(imported, into)
        }
      }

      const sharedFiles = []
      for (const suffix of [
        '/src/boot/store.js', '/src/boot/QZoom.js', '/src/boot/i18n.js', '/src/boot/axios.js',
        '/src/i18n/index.js', '/src/components/DSubpage.vue'
      ]) {
        collectGraph(findChunk(suffix), sharedFiles)
      }

      const sharedCss = new Set()
      for (const fileName of sharedFiles) {
        for (const css of chunkCss.get(fileName) || []) {
          if (!baseCss.has(css)) sharedCss.add(css)
        }
      }

      const preloadLink = (fileName) => `<link rel="modulepreload" crossorigin href="/${fileName}">`
      const styleLink = (fileName) => `<link rel="preload" as="style" href="/${fileName}">`
      const sharedLinks = [
        ...sharedFiles.map(preloadLink),
        ...[...sharedCss].map(styleLink)
      ]

      const pagesDir = resolve(projectRoot, 'src', 'pages')
      const langs = (config.languages || []).map(language => language?.value).filter(Boolean)
      if (langs.length === 0) langs.push(defaultLang)

      let count = 0

      for (const entry of pageEntries) {
        const { page } = entry
        if (page.config === null) continue

        const titleData = page.data?.[defaultLang] || page.data?.['*'] || page.data?.['en-US'] || Object.values(page.data || {})[0]
        const title = titleData?.title || ''
        const fullTitle = title
          ? `${title} — ${brandingName}`
          : brandingName
        const pageDescription = resolveLocalizedValue(page.config?.meta?.description)
        const fullDescription = pageDescription
          || (title && brandingName ? `${title} — Documentation of ${brandingName}` : `Documentation of ${brandingName}`)

        // Each page can have sub-routes: overview, showcase, vs
        const subpages = ['overview']
        if (page.config.subpages?.showcase) subpages.push('showcase')
        if (page.config.subpages?.vs) subpages.push('vs')

        for (const subpage of subpages) {
          const routePath = buildPageRoutePath(entry, subpage)

          const html = baseHtml
            .replace(/<title>[^<]*<\/title>/, () => `<title>${fullTitle}</title>`)
            .replace(
              /(<meta\s+name="?description"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${fullDescription}"`
            )
            .replace(
              /(<meta\s+property="?og:title"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${fullTitle}"`
            )
            .replace(
              /(<meta\s+property="?og:description"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${fullDescription}"`
            )
            .replace(
              /(<meta\s+property="?og:image"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${brandingLogo}"`
            )
            .replace(
              /(<meta\s+name="?twitter:title"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${fullTitle}"`
            )
            .replace(
              /(<meta\s+name="?twitter:description"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${fullDescription}"`
            )
            .replace(
              /(<meta\s+name="?twitter:image"?\s+content=")[^"]*"/,
              (_, p1) => `${p1}${brandingLogo}"`
            )

          // @ Inject the route's preloads (shared graph + this page's markdown)
          const mdLinks = []
          for (const lang of langs) {
            const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, lang)
            const fileName = chunkByFacade.get(srcFile)

            if (fileName && !alreadyLoaded.has(fileName) && !sharedFiles.includes(fileName)) {
              mdLinks.push(preloadLink(fileName))
            }
          }

          const links = [...sharedLinks, ...mdLinks]
          const routeHtml = links.length > 0
            ? html.replace('</head>', `  ${links.join('\n  ')}\n</head>`)
            : html

          const dir = resolve(distDir, routePath)
          mkdirSync(dir, { recursive: true })
          writeFileSync(resolve(dir, 'index.html'), routeHtml)
          // Slash-less twin: Cloudflare Pages serves <route>.html for /<route>
          // directly, avoiding a 308 redirect to the trailing-slash form
          writeFileSync(resolve(distDir, `${routePath}.html`), routeHtml)
          count++

          // The bare page path (its '' child redirects to /overview) gets the
          // same document, so shared links land pre-warmed too
          if (subpage === 'overview') {
            const basePath = buildPageRoutePath(entry, '')
            const baseDir = resolve(distDir, basePath)

            mkdirSync(baseDir, { recursive: true })
            writeFileSync(resolve(baseDir, 'index.html'), routeHtml)
            writeFileSync(resolve(distDir, `${basePath}.html`), routeHtml)
          }
        }
      }

      console.log(`\x1b[36m[docsector]\x1b[0m Pre-rendered meta + route preloads for ${count} routes`)
    }
  }
}

/**
 * Create a Vite plugin that collects git last-commit dates for all Markdown
 * files under src/pages/ and exposes them as a virtual module.
 *
 * Consuming components can `import gitDates from 'virtual:docsector-git-dates'`
 * to get an object mapping relative page keys to ISO date strings.
 *
 * Keys use the pattern: `<type>/<path>.<subpage>.<locale>.md`
 * e.g. `manual/Bootgly/about/what.overview.en-US.md`
 */
function createGitDatesPlugin (projectRoot) {
  const virtualId = 'virtual:docsector-git-dates'
  const resolvedId = '\0' + virtualId
  let dates = {}

  /**
   * Try to unshallow the repository so `git log` returns real commit dates
   * instead of the single clone-time date that shallow CI clones produce.
   */
  function tryUnshallow () {
    try {
      const isShallow = execSync(
        'git rev-parse --is-shallow-repository',
        { cwd: projectRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim()

      if (isShallow === 'true') {
        console.log('[docsector] Shallow repository detected — fetching full history…')
        execSync('git fetch --unshallow', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 60_000
        })
        console.log('[docsector] Repository unshallowed successfully.')
        return true
      }
    } catch {
      console.warn('[docsector] Could not unshallow repository — will try GitHub API fallback.')
      return false
    }
    return true // not shallow, full history available
  }

  /**
   * Extract the GitHub `owner/repo` slug from the consumer's docsector.config.js.
   * Looks for `github.editBaseUrl` (e.g. "https://github.com/bootgly/bootgly_docs/edit/…")
   * or an explicit `github.repo` field (e.g. "bootgly/bootgly_docs").
   */
  function getGitHubRepo () {
    try {
      const configPath = resolve(projectRoot, 'docsector.config.js')
      if (!existsSync(configPath)) return null

      const src = readFileSync(configPath, 'utf-8')

      // Explicit repo field: repo: 'owner/repo'
      const repoMatch = src.match(/repo\s*:\s*['"]([^'"]+)['"]/)
      if (repoMatch) return repoMatch[1]

      // Derive from editBaseUrl: https://github.com/<owner>/<repo>/edit/…
      const urlMatch = src.match(/editBaseUrl\s*:\s*['"]https:\/\/github\.com\/([^/]+\/[^/]+)\//)
      if (urlMatch) return urlMatch[1]
    } catch { /* ignore */ }
    return null
  }

  /**
   * Fetch last-commit dates from the GitHub API for all .md files under src/pages/.
   * Uses the unauthenticated commits endpoint (60 req/hr) or authenticated if
   * GITHUB_TOKEN is set (5 000 req/hr).
   */
  async function collectDatesFromGitHub (pagesDir, repo) {
    console.log(`[docsector] Fetching file dates from GitHub API (${repo})…`)

    const headers = { 'User-Agent': 'docsector-reader', Accept: 'application/vnd.github+json' }
    const token = process.env.GITHUB_TOKEN
    if (token) headers.Authorization = `Bearer ${token}`

    const walkDir = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      let files = []
      for (const entry of entries) {
        const fullPath = resolve(dir, entry.name)
        if (entry.isDirectory()) {
          files = files.concat(walkDir(fullPath))
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath)
        }
      }
      return files
    }

    const files = walkDir(pagesDir)
    let fetched = 0

    for (const fullPath of files) {
      const relKey = fullPath.slice(pagesDir.length + 1)
      const apiPath = `src/pages/${relKey}`
      const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(apiPath)}&per_page=1`

      try {
        const res = await fetch(url, { headers })
        if (!res.ok) {
          if (res.status === 403 || res.status === 429) {
            console.warn('[docsector] GitHub API rate limit reached — stopping.')
            break
          }
          continue
        }
        const commits = await res.json()
        if (commits.length > 0 && commits[0].commit) {
          dates[relKey] = commits[0].commit.committer.date
          fetched++
        }
      } catch {
        // Network error — skip this file
      }
    }

    console.log(`[docsector] Fetched dates for ${fetched}/${files.length} files from GitHub API.`)
  }

  function collectDatesFromGit (pagesDir) {
    const walkDir = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = resolve(dir, entry.name)
        if (entry.isDirectory()) {
          walkDir(fullPath)
        } else if (entry.name.endsWith('.md')) {
          try {
            const date = execSync(
              `git log -1 --format=%cI -- "${fullPath}"`,
              { cwd: projectRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
            ).trim()
            if (date) {
              const relKey = fullPath.slice(pagesDir.length + 1)
              dates[relKey] = date
            }
          } catch {
            // git not available or file untracked — skip
          }
        }
      }
    }

    walkDir(pagesDir)
  }

  async function collectDates () {
    dates = {}
    const pagesDir = resolve(projectRoot, 'src', 'pages')
    if (!existsSync(pagesDir)) return

    // 1. Try to unshallow so git log returns real dates
    const hasFullHistory = tryUnshallow()

    // 2. Collect dates from local git
    collectDatesFromGit(pagesDir)

    // 3. Check if all dates are the same (sign of shallow clone with no unshallow)
    const uniqueDates = new Set(Object.values(dates))
    if (uniqueDates.size <= 1 && Object.keys(dates).length > 1 && !hasFullHistory) {
      // All files share the same date — likely shallow clone fallback
      const repo = getGitHubRepo()
      if (repo) {
        dates = {}
        await collectDatesFromGitHub(pagesDir, repo)
      }
    }
  }

  return {
    name: 'docsector-git-dates',
    async buildStart () {
      await collectDates()
    },
    resolveId (id) {
      if (id === virtualId) return resolvedId
    },
    load (id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(dates)}`
      }
    }
  }
}

function getHomePageConfig (config = {}) {
  const homePage = config.homePage || {}
  return {
    source: homePage.source || 'local',
    remoteReadmeUrl: homePage.remoteReadmeUrl || null,
    timeoutMs: Number.isFinite(homePage.timeoutMs)
      ? Math.max(1000, Number(homePage.timeoutMs))
      : 8000,
    fallbackToLocal: homePage.fallbackToLocal !== false
  }
}

function getConfiguredLanguages (config = {}) {
  const defaultLang = config.defaultLanguage || config.languages?.[0]?.value || 'en-US'
  const languageValues = config.languages?.map(language => language.value).filter(Boolean) || []
  const langs = [...new Set([defaultLang, ...languageValues])]
  return { defaultLang, langs }
}

async function fetchRemoteMarkdown (url, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.8'
      },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`Remote README request failed with status ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

export async function resolveHomePageSources (projectRoot, config = {}, options = {}) {
  const { logPrefix = '[docsector]' } = options
  const pagesDir = resolve(projectRoot, 'src', 'pages')
  const { defaultLang, langs } = getConfiguredLanguages(config)
  const homePageConfig = getHomePageConfig(config)

  const byLang = {}
  let mode = 'local'

  if (homePageConfig.source === 'remote-readme' && homePageConfig.remoteReadmeUrl) {
    try {
      const remote = await fetchRemoteMarkdown(homePageConfig.remoteReadmeUrl, homePageConfig.timeoutMs)
      for (const lang of langs) {
        byLang[lang] = remote
      }
      mode = 'remote-readme'
      console.log(`\x1b[36m${logPrefix}\x1b[0m Loaded remote README for home page`)
      return { mode, byLang, defaultLang, langs }
    } catch (error) {
      const reason = error?.message || String(error)
      console.warn(`${logPrefix} Failed to load remote README for home page: ${reason}`)

      if (!homePageConfig.fallbackToLocal) {
        throw error
      }
    }
  }

  for (const lang of langs) {
    const homepage = resolve(pagesDir, `Homepage.${lang}.md`)
    if (existsSync(homepage)) {
      byLang[lang] = readFileSync(homepage, 'utf-8')
      continue
    }

    const fallback = resolve(pagesDir, `Homepage.${defaultLang}.md`)
    if (existsSync(fallback)) {
      byLang[lang] = readFileSync(fallback, 'utf-8')
    }
  }

  return { mode, byLang, defaultLang, langs }
}

/**
 * Material icon subset — the ligature webfont weighed ~125 KB on every page
 * load to cover 2100+ glyphs. This plugin scans the engine source, the
 * consumer's page registry/markdown and docsector.config.js for icon names,
 * and exposes `virtual:docsector-icons`: a name → SVG map tree-shaken from
 * @quasar/extras/material-icons. boot/icons.js registers it as Quasar's
 * iconMapFn, so dynamic names (`icon: 'rocket_launch'` in configs and
 * markdown blocks) keep working — as inline SVGs instead of font ligatures.
 * Names the scan cannot see (fully computed at runtime) can be forced via
 * `icons: { include: ['name'] }` in docsector.config.js.
 */
const ICON_SCAN_EXTENSIONS = Object.freeze(['.vue', '.js', '.md'])
const ICON_SCAN_SKIP_DIRS = Object.freeze(new Set(['node_modules', 'dist', 'tmp', '.git']))

function materialIconExportName (name) {
  const camel = String(name)
    .split(/[_-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  return `mat${camel}`
}

function collectIconTokens (source, tokens) {
  for (const line of String(source).split('\n')) {
    // ? only lines that mention icons — keeps ordinary strings out
    if (!/icon/i.test(line)) continue

    for (const match of line.matchAll(/['"]([a-z0-9][a-z0-9_]{1,40})['"]/g)) {
      tokens.add(match[1])
    }
  }
}

function scanIconFiles (dir, tokens, seenFiles) {
  if (!existsSync(dir)) return

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ICON_SCAN_SKIP_DIRS.has(entry.name)) {
        scanIconFiles(resolve(dir, entry.name), tokens, seenFiles)
      }
      continue
    }

    const filePath = resolve(dir, entry.name)
    if (seenFiles.has(filePath)) continue
    if (!ICON_SCAN_EXTENSIONS.some(extension => entry.name.endsWith(extension))) continue

    seenFiles.add(filePath)
    collectIconTokens(readFileSync(filePath, 'utf-8'), tokens)
  }
}

function createIconsPlugin (projectRoot) {
  const virtualId = 'virtual:docsector-icons'
  const resolvedId = '\0' + virtualId
  let cachedModule = null

  const buildModule = async () => {
    if (cachedModule) return cachedModule

    const packageRoot = getPackageRoot(projectRoot)

    // ! Available SVG exports (resolved from the project's dependency tree)
    const available = new Set()
    try {
      const projectRequire = createRequire(resolve(projectRoot, 'package.json'))
      const extrasIndex = readFileSync(projectRequire.resolve('@quasar/extras/material-icons/index.js'), 'utf-8')

      for (const match of extrasIndex.matchAll(/module\.exports\.(mat[A-Za-z0-9]+)\s*=/g)) {
        available.add(match[1])
      }
    } catch (error) {
      console.warn(`[docsector] Could not read @quasar/extras material icons: ${error?.message || String(error)}`)
    }

    // @ Scan engine source, consumer content and config for icon name tokens
    const tokens = new Set()
    const seenFiles = new Set()
    scanIconFiles(resolve(packageRoot, 'src'), tokens, seenFiles)
    scanIconFiles(resolve(projectRoot, 'src', 'pages'), tokens, seenFiles)

    const configPath = resolve(projectRoot, 'docsector.config.js')
    if (existsSync(configPath)) {
      collectIconTokens(readFileSync(configPath, 'utf-8'), tokens)

      try {
        const { default: config } = await import(pathToFileURL(configPath).href)
        for (const name of config.icons?.include || []) {
          tokens.add(String(name))
        }
      } catch {
        // config already validated elsewhere; scanning is best-effort
      }
    }

    // ? Keep only tokens that are real material icon names
    const entries = []
    for (const name of [...tokens].sort()) {
      const exportName = materialIconExportName(name)
      if (available.has(exportName)) {
        entries.push({ name, exportName })
      }
    }

    const imports = [...new Set(entries.map(entry => entry.exportName))].join(', ')
    const mapBody = entries
      .map(entry => `  ${JSON.stringify(entry.name)}: ${entry.exportName}`)
      .join(',\n')

    cachedModule = entries.length === 0
      ? 'export default {}'
      : [
          `import { ${imports} } from '@quasar/extras/material-icons'`,
          'export default {',
          mapBody,
          '}'
        ].join('\n')

    console.log(`\x1b[36m[docsector]\x1b[0m Icon subset: ${entries.length} material icons bundled as SVG`)

    return cachedModule
  }

  return {
    name: 'docsector-icons',
    resolveId (id) {
      if (id === virtualId) return resolvedId
    },
    async load (id) {
      if (id === resolvedId) {
        return buildModule()
      }
    }
  }
}

function createHomePageOverridePlugin (projectRoot) {
  const virtualId = 'virtual:docsector-homepage-override'
  const resolvedId = '\0' + virtualId
  let homePageSources = null
  let loadPromise = null

  const ensureSources = async () => {
    if (homePageSources) return homePageSources
    if (!loadPromise) {
      loadPromise = (async () => {
        const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href
        const { default: config } = await import(configUrl)
        homePageSources = await resolveHomePageSources(projectRoot, config, { logPrefix: '[docsector]' })
        return homePageSources
      })().finally(() => {
        loadPromise = null
      })
    }

    return loadPromise
  }

  return {
    name: 'docsector-homepage-override',
    resolveId (id) {
      if (id === virtualId) return resolvedId
    },
    async buildStart () {
      await ensureSources()
    },
    configureServer () {
      ensureSources().catch((error) => {
        console.warn(`[docsector] Could not prepare home page override: ${error?.message || String(error)}`)
      })
    },
    async load (id) {
      if (id === resolvedId) {
        const sources = await ensureSources()
        return [
          `export const homePageSourceMode = ${JSON.stringify(sources?.mode || 'local')}`,
          `export default ${JSON.stringify(sources?.byLang || {})}`
        ].join('\n')
      }

      const sources = await ensureSources()
      if (!sources?.byLang) return null

      const match = id.match(/Homepage\.([A-Za-z0-9-]+)\.md\?raw(?:$|&)/)
      if (!match) return null

      const lang = match[1]
      const content = sources.byLang[lang]
      if (typeof content !== 'string') return null

      return `export default ${JSON.stringify(content)}`
    }
  }
}

/**
 * Create a Vite plugin that serves raw Markdown content for `.md` suffixed URLs.
 *
 * In **dev mode**, intercepts requests like `/manual/Bootgly/about/what/overview.md`
 * and serves the corresponding `src/pages/manual/Bootgly/about/what.overview.<lang>.md`
 * file as `text/plain; charset=utf-8`.
 *
 * In **production build** (`closeBundle`), generates static `.md` files in `dist/spa/`
 * for each page/subpage so that the `.md` URLs resolve to actual files on any static host.
 *
 * The language served is determined by the `?lang=` query parameter, falling back to the
 * `defaultLanguage` from `docsector.config.js`.
 */
/**
 * Every route renders through DefaultLayout, but the browser only discovers
 * that lazy chunk after boot + router resolution — extra network rounds on
 * the critical path of every first paint. Inject modulepreload links for it
 * (and its not-yet-preloaded static imports) into the built index.html so it
 * downloads in parallel with the entry.
 *
 * DSubpage is intentionally NOT preloaded: its chunk is large enough that
 * preloading it contends with the render-blocking CSS on slow links and
 * measurably worsens FCP/LCP.
 */
function createRoutePreloadPlugin () {
  const FACADES = ['/layouts/DefaultLayout.vue']

  return {
    name: 'docsector-route-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler (html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html

        const chunks = Object.values(bundle)
        const entry = chunks.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
        const preloaded = new Set([entry?.fileName, ...(entry?.imports || [])])

        const files = []
        const collect = (fileName) => {
          if (!fileName || preloaded.has(fileName) || files.includes(fileName)) return

          const chunk = bundle[fileName]
          if (!chunk || chunk.type !== 'chunk') return

          files.push(fileName)
          for (const imported of chunk.imports || []) collect(imported)
        }

        for (const chunk of chunks) {
          if (chunk.type !== 'chunk' || !chunk.facadeModuleId) continue

          if (FACADES.some((facade) => chunk.facadeModuleId.endsWith(facade))) {
            collect(chunk.fileName)
          }
        }

        if (files.length === 0) return html

        // Root-relative hrefs — matches Quasar's default publicPath
        const links = files
          .map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`)
          .join('\n  ')

        return html.replace('</head>', `  ${links}\n</head>`)
      }
    }
  }
}

/**
 * Roboto ships without font-display, so text stays invisible while the font
 * downloads. Inject `font-display: optional` — text paints immediately with
 * the fallback font and never shifts mid-view; the webfont is cached for the
 * next navigation. Icon fonts keep their default (a fallback would flash
 * ligature text).
 */
function createFontDisplayPlugin () {
  return {
    name: 'docsector-font-display',
    transform (code, id) {
      if (id.includes('roboto-font') && id.endsWith('.css')) {
        return code.replace(/@font-face\s*\{/g, '@font-face{font-display:optional;')
      }
    }
  }
}

function createMarkdownEndpointPlugin (projectRoot) {
  const pagesDir = resolve(projectRoot, 'src', 'pages')

  function resolveMarkdownFile (urlPath, lang) {
    // URL: /manual/Bootgly/about/what/overview.md
    // Strip leading slash and trailing .md
    const clean = urlPath.replace(/^\//, '').replace(/\.md$/, '')
    // Split into segments: ['manual', 'Bootgly', 'about', 'what', 'overview']
    const segments = clean.split('/')
    if (segments.length < 2) return null

    // Last segment is the subpage (overview, showcase, vs)
    const subpage = segments.pop()
    // Remaining segments form the type + path: 'manual/Bootgly/about/what'
    const basePath = segments.join('/')

    // File: src/pages/manual/Bootgly/about/what.overview.en-US.md
    const filePath = resolve(pagesDir, `${basePath}.${subpage}.${lang}.md`)
    if (existsSync(filePath)) return filePath

    return null
  }

  function resolveNegotiatedFile (urlPath, lang) {
    const pathname = (urlPath || '').split('?')[0]

    if (pathname === '/' || pathname === '/index.html') {
      const homepage = resolve(pagesDir, `Homepage.${lang}.md`)
      return existsSync(homepage) ? homepage : null
    }

    if (pathname.endsWith('.md')) {
      return resolveMarkdownFile(pathname, lang)
    }

    let clean = pathname
    if (clean.endsWith('/index.html')) clean = clean.slice(0, -11)
    if (clean.endsWith('/')) clean = clean.slice(0, -1)

    if (!clean) {
      const homepage = resolve(pagesDir, `Homepage.${lang}.md`)
      return existsSync(homepage) ? homepage : null
    }

    if (clean.endsWith('/overview') || clean.endsWith('/showcase') || clean.endsWith('/vs')) {
      return resolveMarkdownFile(`${clean}.md`, lang)
    }

    return resolveMarkdownFile(`${clean}/overview.md`, lang)
  }

  function estimateMarkdownTokens (markdown = '') {
    return Math.max(1, Math.ceil(markdown.length / 4))
  }

  return {
    name: 'docsector-markdown-endpoint',

    configureServer (server) {
      let defaultLang = 'en-US'
      let markdownNegotiationEnabled = true
      let markdownAgentFallback = true
      let homepageByLang = null

      const configReady = (async () => {
        try {
          const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href
          const { default: config } = await import(configUrl)

          defaultLang = config.defaultLanguage || config.languages?.[0]?.value || 'en-US'
          const markdownNegotiationConfig = config.markdownNegotiation || {}
          markdownNegotiationEnabled = markdownNegotiationConfig.enabled !== false
          markdownAgentFallback = markdownNegotiationConfig.agentFallback !== false

          const sources = await resolveHomePageSources(projectRoot, config, { logPrefix: '[docsector]' })
          homepageByLang = sources.byLang
        } catch (error) {
          console.warn(`[docsector] Could not load config for markdown endpoint: ${error?.message || String(error)}`)
        }
      })()

      let booksRegistryPromise = null

      server.middlewares.use(async (req, res, next) => {
        await configReady

        const url = new URL(req.url, 'http://localhost')
        const accept = (req.headers.accept || '').toLowerCase()
        const wantsMarkdown = accept.includes('text/markdown')
        const lang = url.searchParams.get('lang') || defaultLang

        // Serve the page-content search index in dev (built at request time)
        const searchIndexMatch = url.pathname.match(/^\/search-index\.([A-Za-z0-9-]+)\.json$/)
        if (searchIndexMatch) {
          try {
            booksRegistryPromise = booksRegistryPromise || loadBooksRegistry(projectRoot)
            const { pageEntries } = await booksRegistryPromise
            const searchIndex = buildSearchContentIndex(pagesDir, pageEntries, searchIndexMatch[1])

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(searchIndex))
          } catch (error) {
            console.warn(`[docsector] Could not build search index: ${error?.message || String(error)}`)
            res.statusCode = 404
            res.end('{}')
          }
          return
        }

        const homepagePath = url.pathname === '/' || url.pathname === '/index.html'
        const remoteHomepage = homepageByLang?.[lang] || homepageByLang?.[defaultLang] || null

        const homepageMarkdownMatch = url.pathname.match(/^\/homepage(?:\.([A-Za-z0-9-]+))?\.md$/i)
        if (homepageMarkdownMatch) {
          const requestedLang = homepageMarkdownMatch[1] || lang
          const homepageMarkdown = homepageByLang?.[requestedLang] || homepageByLang?.[defaultLang] || null

          if (typeof homepageMarkdown === 'string' && homepageMarkdown.length > 0) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.setHeader('Vary', 'Accept')
            res.setHeader('x-markdown-tokens', String(estimateMarkdownTokens(homepageMarkdown)))
            res.end(homepageMarkdown)
            return
          }
        }

        if (homepagePath && typeof remoteHomepage === 'string' && remoteHomepage.length > 0) {
          if ((markdownNegotiationEnabled && wantsMarkdown) || (markdownAgentFallback && matchesMarkdownAgentUserAgent(req.headers['user-agent'] || ''))) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.setHeader('Vary', 'Accept')
            res.setHeader('x-markdown-tokens', String(estimateMarkdownTokens(remoteHomepage)))
            res.end(remoteHomepage)
            return
          }
        }

        // Explicit .md request
        if (url.pathname.endsWith('.md')) {
          const file = resolveMarkdownFile(url.pathname, lang)
          if (!file) return next()

          const content = readFileSync(file, 'utf-8')
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
          res.setHeader('Vary', 'Accept')
          res.setHeader('x-markdown-tokens', String(estimateMarkdownTokens(content)))
          res.end(content)
          return
        }

        // Content negotiation for agents requesting markdown explicitly
        if (markdownNegotiationEnabled && wantsMarkdown) {
          const file = resolveNegotiatedFile(url.pathname, lang)
          if (file) {
            const content = readFileSync(file, 'utf-8')
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.setHeader('Vary', 'Accept')
            res.setHeader('x-markdown-tokens', String(estimateMarkdownTokens(content)))
            res.end(content)
            return
          }
        }

        // Auto-serve markdown to LLM bot crawlers
        const ua = req.headers['user-agent'] || ''
        if (markdownAgentFallback && matchesMarkdownAgentUserAgent(ua)) {
          const file = resolveNegotiatedFile(url.pathname, lang)
          if (file) {
            const content = readFileSync(file, 'utf-8')
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.setHeader('Vary', 'Accept')
            res.setHeader('x-markdown-tokens', String(estimateMarkdownTokens(content)))
            res.end(content)
            return
          }
        }

        next()
      })
    },

    apply: 'serve'
  }
}

function collectAiSearchIndexEntries ({ pagesDir, pageEntries = [], defaultLang = 'en-US' } = {}) {
  const entries = []

  for (const entry of pageEntries) {
    const { book, pagePath, page } = entry
    if (page?.config === null) continue
    if (page?.config?.status === 'empty') continue

    const title = page?.data?.['*']?.title
      || page?.data?.[defaultLang]?.title
      || page?.data?.['en-US']?.title
      || pagePath?.split('/').pop()
      || pagePath

    const subpages = ['overview']
    if (page?.config?.subpages?.showcase) subpages.push('showcase')
    if (page?.config?.subpages?.vs) subpages.push('vs')

    for (const subpage of subpages) {
      const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, defaultLang)
      if (!existsSync(srcFile)) continue

      const routePath = buildPageRoutePath(entry, subpage)
      entries.push({
        title,
        path: routePath,
        markdownPath: `${routePath}.md`,
        locale: defaultLang,
        book,
        version: entry.version,
        subpage
      })
    }
  }

  return entries
}

function collectStandardSitemapEntries ({ pagesDir, pageEntries = [], defaultLang = 'en-US' } = {}) {
  const entries = [
    { path: '/', priority: '1.0' }
  ]
  const seenPaths = new Set(['/'])

  for (const entry of pageEntries) {
    const { page } = entry
    if (page?.config === null) continue
    if (page?.config?.status === 'empty') continue

    const subpages = ['overview']
    if (page?.config?.subpages?.showcase) subpages.push('showcase')
    if (page?.config?.subpages?.vs) subpages.push('vs')

    for (const subpage of subpages) {
      const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, defaultLang)
      if (!existsSync(srcFile)) continue

      const routePath = buildPageRoutePath(entry, subpage, { leadingSlash: true })
      if (seenPaths.has(routePath)) continue

      seenPaths.add(routePath)
      entries.push({ path: routePath })
    }
  }

  return entries
}

export function getAdvertisedRobotsSitemapPaths ({ sitemapEnabled = true } = {}) {
  const paths = []

  if (sitemapEnabled) {
    paths.push('/sitemap.xml')
  }

  return paths
}

/**
 * Create a Vite plugin that generates static `.md` files at build time.
 *
 * Runs in the `closeBundle` hook alongside the prerender-meta plugin.
 * For each page/subpage, copies the raw Markdown source into
 * `dist/spa/<routePath>.md` so that `.md` URLs work on static hosts.
 */
function createMarkdownBuildPlugin (projectRoot) {
  return {
    name: 'docsector-markdown-build',
    apply: 'build',
    async closeBundle () {
      const distDir = resolve(projectRoot, 'dist', 'spa')
      if (!existsSync(distDir)) return

      const pagesDir = resolve(projectRoot, 'src', 'pages')
      const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href

      const { default: config } = await import(configUrl)
      const { pageEntries } = await loadBooksRegistry(projectRoot)
      const assistantConfig = normalizeAiAssistantConfig(config)

      const defaultLang = config.defaultLanguage || config.languages?.[0]?.value || 'en-US'
      let count = 0

      for (const entry of pageEntries) {
        const { page } = entry
        if (page.config === null) continue
        if (page.config.status === 'empty') continue

        const subpages = ['overview']
        if (page.config.subpages?.showcase) subpages.push('showcase')
        if (page.config.subpages?.vs) subpages.push('vs')

        for (const subpage of subpages) {
          const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, defaultLang)
          if (!existsSync(srcFile)) continue

          const routePath = buildPageRoutePath(entry, subpage)
          const destFile = resolve(distDir, `${routePath}.md`)
          const destDir = resolve(destFile, '..')

          mkdirSync(destDir, { recursive: true })
          writeFileSync(destFile, readFileSync(srcFile, 'utf-8'))
          count++
        }
      }

      // Generate homepage markdown files so root content can be negotiated in production
      const homepageSources = await resolveHomePageSources(projectRoot, config, { logPrefix: '[docsector]' })
      let homepageCount = 0
      for (const lang of homepageSources.langs) {
        const homepageContent = homepageSources.byLang?.[lang]
        if (typeof homepageContent !== 'string' || homepageContent.length === 0) continue

        writeFileSync(resolve(distDir, `homepage.${lang}.md`), homepageContent)
        if (lang === homepageSources.defaultLang) {
          writeFileSync(resolve(distDir, 'homepage.md'), homepageContent)
        }
        homepageCount++
      }
      if (homepageCount > 0) {
        console.log(`\x1b[36m[docsector]\x1b[0m Generated ${homepageCount} homepage markdown file(s)`)
      }

      console.log(`\x1b[36m[docsector]\x1b[0m Generated ${count} static .md files`)

      // Generate per-language search content indexes (fetched on first sidebar content search)
      const searchIndexLangs = resolveSearchIndexLangs(config)
      for (const lang of searchIndexLangs) {
        const searchIndex = buildSearchContentIndex(pagesDir, pageEntries, lang)
        writeFileSync(resolve(distDir, `search-index.${lang}.json`), JSON.stringify(searchIndex))
      }
      console.log(`\x1b[36m[docsector]\x1b[0m Generated ${searchIndexLangs.length} search index file(s)`)

      const siteUrl = (config.siteUrl || '').replace(/\/+$/, '')
      const generatedAt = new Date().toISOString()
      const sitemapConfig = config.sitemap || {}
      const sitemapEnabled = sitemapConfig.enabled !== false

      if (sitemapEnabled) {
        const sitemapEntries = collectStandardSitemapEntries({ pagesDir, pageEntries, defaultLang })
        const sitemap = createSitemap({
          entries: sitemapEntries,
          generatedAt,
          siteUrl
        })
        writeFileSync(resolve(distDir, 'sitemap.xml'), sitemap)
        console.log(`\x1b[36m[docsector]\x1b[0m Generated sitemap.xml (${sitemapEntries.length} URLs)`)
      }

      if (siteUrl) {
        // Generate llms.txt and llms-full.txt (LLM-friendly page index and full content)
        const brandingName = config.branding?.name || 'Documentation'
        const brandingVersion = config.branding?.version || ''
        const brandingDesc = config.branding?.description || `${brandingName} documentation`

        let llmsIndex = `# ${brandingName}${brandingVersion ? ' ' + brandingVersion : ''}\n\n> ${brandingDesc}\n\n`
        let llmsFull = `# ${brandingName}${brandingVersion ? ' ' + brandingVersion : ''}\n\n> ${brandingDesc}\n\n---\n\n`

        const llmsSections = {}

        for (const entry of pageEntries) {
          const { book, pagePath, page } = entry
          if (page.config === null) continue
          if (page.config.status === 'empty') continue

          const title = page.data?.['*']?.title
            || page.data?.[defaultLang]?.title
            || page.data?.['en-US']?.title
            || pagePath.split('/').pop()
            || pagePath

          const subpages = ['overview']
          if (page.config.subpages?.showcase) subpages.push('showcase')
          if (page.config.subpages?.vs) subpages.push('vs')

          for (const subpage of subpages) {
            const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, defaultLang)
            if (!existsSync(srcFile)) continue

            const routePath = buildPageRoutePath(entry, subpage)
            const mdUrl = `${siteUrl}/${routePath}.md`
            const pageUrl = `${siteUrl}/${routePath}`

            const desc = page.config.meta?.description
            const descText = typeof desc === 'object' ? (desc[defaultLang] || desc['en-US'] || '') : (desc || '')

            if (!llmsSections[book]) llmsSections[book] = []
            llmsSections[book].push(
              descText
                ? `- [${title}](${mdUrl}): ${descText}`
                : `- [${title}](${mdUrl})`
            )

            const content = readFileSync(srcFile, 'utf-8')
            llmsFull += `## ${title}\n\nSource: ${pageUrl}\n\n${content}\n\n---\n\n`
          }
        }

        for (const [section, entries] of Object.entries(llmsSections)) {
          const sectionName = section.charAt(0).toUpperCase() + section.slice(1)
          llmsIndex += `## ${sectionName}\n\n${entries.join('\n')}\n\n`
        }

        writeFileSync(resolve(distDir, 'llms.txt'), llmsIndex.trimEnd() + '\n')
        writeFileSync(resolve(distDir, 'llms-full.txt'), llmsFull.trimEnd() + '\n')
        console.log(`\x1b[36m[docsector]\x1b[0m Generated llms.txt and llms-full.txt`)
      }

      // Generate _headers file for Cloudflare Pages (append if exists)
      const headersPath = resolve(distDir, '_headers')
      const headersRule = '/*.md\n  Content-Type: text/markdown; charset=utf-8\n'
      if (existsSync(headersPath)) {
        const existing = readFileSync(headersPath, 'utf-8')
        if (!existing.includes('*.md')) {
          writeFileSync(headersPath, existing.trimEnd() + '\n\n' + headersRule)
        }
      } else {
        writeFileSync(headersPath, headersRule)
      }

      const markdownNegotiationConfig = config.markdownNegotiation || {}
      const markdownNegotiationEnabled = markdownNegotiationConfig.enabled !== false
      const markdownAgentFallback = markdownNegotiationConfig.agentFallback !== false
      const webBotAuthConfig = config.webBotAuth || {}
      const webBotAuthEnabled = webBotAuthConfig.enabled === true
      const webBotAuthDirectoryPath = webBotAuthConfig.directoryPath || '/.well-known/http-message-signatures-directory'
      const webBotAuthJwksEnv = webBotAuthConfig.jwksEnv || 'WEB_BOT_AUTH_JWKS'
      const webBotAuthPrivateJwkEnv = webBotAuthConfig.privateJwkEnv || 'WEB_BOT_AUTH_PRIVATE_JWK'
      const webBotAuthKeyIdEnv = webBotAuthConfig.keyIdEnv || 'WEB_BOT_AUTH_KEY_ID'
      const webBotAuthStaticKeyId = webBotAuthConfig.keyId || null
      const webBotAuthSignatureMaxAge = Number.isFinite(webBotAuthConfig.signatureMaxAge)
        ? Math.max(30, Number(webBotAuthConfig.signatureMaxAge))
        : 300
      const webBotAuthSignatureLabel = webBotAuthConfig.signatureLabel || 'sig1'
      const contentSignalsConfig = config.contentSignals || {}
      const contentSignalsEnabled = contentSignalsConfig.enabled === true
      const agentSkillsConfig = config.agentSkills || {}
      const agentSkillsEnabled = agentSkillsConfig.enabled === true
      const mcpServerCardConfig = config.mcpServerCard || {}
      const mcpServerCardEnabled = mcpServerCardConfig.enabled === true
      const aiAssistantEnabled = assistantConfig.enabled === true
      let aiSearchSitemapGenerated = false

      const toUrl = (href) => {
        if (!href) return null
        if (/^https?:\/\//i.test(href)) return href
        const normalizedHref = href.startsWith('/') ? href : `/${href}`
        return siteUrl ? `${siteUrl}${normalizedHref}` : normalizedHref
      }

      const normalizeLocalPath = (href) => {
        if (!href || /^https?:\/\//i.test(href)) return null
        const path = href.startsWith('/') ? href.slice(1) : href
        return path || null
      }

      if (aiAssistantEnabled && assistantConfig.provider === 'aiSearch') {
        const aiSearchEntries = collectAiSearchIndexEntries({
          pagesDir,
          pageEntries,
          defaultLang
        })
        const artifacts = createAiSearchIndexArtifacts({
          siteUrl,
          entries: aiSearchEntries
        })
        const manifestPath = '.well-known/ai-search/manifest.json'
        const sitemapPath = 'ai-search-sitemap.xml'

        mkdirSync(resolve(distDir, '.well-known', 'ai-search'), { recursive: true })
        writeFileSync(resolve(distDir, manifestPath), JSON.stringify(artifacts.manifest, null, 2) + '\n')
        if (artifacts.sitemap) {
          writeFileSync(resolve(distDir, sitemapPath), artifacts.sitemap)
          aiSearchSitemapGenerated = true
        }
        console.log(`\x1b[36m[docsector]\x1b[0m Generated AI Search index artifacts (${aiSearchEntries.length} pages)`)

        const headersWithAiSearch = readFileSync(headersPath, 'utf-8')
        const aiSearchHeaders = [
          '/.well-known/ai-search/manifest.json\n  Content-Type: application/json; charset=utf-8',
          '/ai-search-sitemap.xml\n  Content-Type: application/xml; charset=utf-8'
        ].filter(rule => !headersWithAiSearch.includes(rule.split('\n')[0])).join('\n\n')
        if (aiSearchHeaders) {
          writeFileSync(headersPath, headersWithAiSearch.trimEnd() + '\n\n' + aiSearchHeaders + '\n')
        }
      }

      if (aiAssistantEnabled) {
        const functionsDir = resolve(projectRoot, 'functions')
        const packageRoot = getPackageRoot(projectRoot)
        const templatePath = resolve(packageRoot, 'src', 'ai-assistant', 'server.js')
        mkdirSync(functionsDir, { recursive: true })

        if (existsSync(templatePath)) {
          // Replacer function, not a plain string: `$&`, `` $` `` and `$'` in a
          // consumer's config (a suggested prompt, say) would otherwise be
          // interpolated into the generated endpoint.
          const serverCode = readFileSync(templatePath, 'utf-8')
            .replaceAll('__AI_ASSISTANT_CONFIG__', () => JSON.stringify(assistantConfig, null, 2))

          writeFileSync(resolve(functionsDir, 'assistant.js'), serverCode)
          console.log(`\x1b[36m[docsector]\x1b[0m Generated AI Assistant endpoint at functions/assistant.js`)
        }
      }

      if (markdownNegotiationEnabled || webBotAuthEnabled) {
        const functionsDir = resolve(projectRoot, 'functions')
        mkdirSync(functionsDir, { recursive: true })

        const middlewareCode = `const LLM_BOT_PATTERN = new RegExp(${JSON.stringify(MARKDOWN_AGENT_USER_AGENT_SOURCE)}, 'i')

const DEFAULT_LANG = ${JSON.stringify(defaultLang)}
const MARKDOWN_ENABLED = ${markdownNegotiationEnabled ? 'true' : 'false'}
const AGENT_FALLBACK = ${markdownAgentFallback ? 'true' : 'false'}
const WEB_BOT_AUTH_ENABLED = ${webBotAuthEnabled ? 'true' : 'false'}
const WEB_BOT_AUTH_DIRECTORY_PATH = ${JSON.stringify(webBotAuthDirectoryPath)}
const WEB_BOT_AUTH_JWKS_ENV = ${JSON.stringify(webBotAuthJwksEnv)}
const WEB_BOT_AUTH_PRIVATE_JWK_ENV = ${JSON.stringify(webBotAuthPrivateJwkEnv)}
const WEB_BOT_AUTH_KEY_ID_ENV = ${JSON.stringify(webBotAuthKeyIdEnv)}
const WEB_BOT_AUTH_STATIC_KEY_ID = ${JSON.stringify(webBotAuthStaticKeyId)}
const WEB_BOT_AUTH_SIGNATURE_MAX_AGE = ${webBotAuthSignatureMaxAge}
const WEB_BOT_AUTH_SIGNATURE_LABEL = ${JSON.stringify(webBotAuthSignatureLabel)}

const textEncoder = new TextEncoder()

function bytesToBase64 (bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function bytesToBase64Url (bytes) {
  return bytesToBase64(bytes).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '')
}

async function sha256 (input) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(input))
  return new Uint8Array(digest)
}

async function computeJwkThumbprint (jwk) {
  if (!jwk || jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || !jwk.x) {
    return null
  }

  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })
  const digest = await sha256(canonical)
  return bytesToBase64Url(digest)
}

function parseJsonEnv (env, key) {
  const raw = env?.[key]
  if (!raw || typeof raw !== 'string') {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function badWebBotAuthResponse (message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
}

async function importEd25519PrivateKey (privateJwk) {
  if (!privateJwk || privateJwk.kty !== 'OKP' || privateJwk.crv !== 'Ed25519' || !privateJwk.d || !privateJwk.x) {
    return null
  }

  return crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'Ed25519' },
    false,
    ['sign']
  )
}

async function signDirectoryResponse ({ authority, keyId, created, expires, privateKey }) {
  const params = '("@authority";req);created=' + created + ';expires=' + expires + ';keyid="' + keyId + '";alg="ed25519";tag="http-message-signatures-directory"'
  const signatureInput = WEB_BOT_AUTH_SIGNATURE_LABEL + '=' + params
  const base = '"@authority";req: ' + authority + '\\n"@signature-params": ' + params
  const signature = await crypto.subtle.sign('Ed25519', privateKey, textEncoder.encode(base))

  return {
    signatureInput,
    signature: WEB_BOT_AUTH_SIGNATURE_LABEL + '=:' + bytesToBase64(new Uint8Array(signature)) + ':'
  }
}

async function handleWebBotAuthDirectory (request, env, pathname) {
  if (!WEB_BOT_AUTH_ENABLED || pathname !== WEB_BOT_AUTH_DIRECTORY_PATH) {
    return null
  }

  const jwks = parseJsonEnv(env, WEB_BOT_AUTH_JWKS_ENV)
  if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    return badWebBotAuthResponse('Missing or invalid JWKS in env var ' + WEB_BOT_AUTH_JWKS_ENV)
  }

  const privateJwk = parseJsonEnv(env, WEB_BOT_AUTH_PRIVATE_JWK_ENV)
  if (!privateJwk) {
    return badWebBotAuthResponse('Missing or invalid private JWK in env var ' + WEB_BOT_AUTH_PRIVATE_JWK_ENV)
  }

  const privateKey = await importEd25519PrivateKey(privateJwk)
  if (!privateKey) {
    return badWebBotAuthResponse('Private JWK must be an Ed25519 OKP key with d and x')
  }

  const selectedPublicJwk = jwks.keys.find((key) => key && key.kty === 'OKP' && key.crv === 'Ed25519' && typeof key.x === 'string')
  if (!selectedPublicJwk) {
    return badWebBotAuthResponse('JWKS must include at least one Ed25519 public JWK')
  }

  const envKeyId = env?.[WEB_BOT_AUTH_KEY_ID_ENV]
  const computedKeyId = await computeJwkThumbprint(selectedPublicJwk)
  const keyId = envKeyId || WEB_BOT_AUTH_STATIC_KEY_ID || selectedPublicJwk.kid || computedKeyId
  if (!keyId) {
    return badWebBotAuthResponse('Unable to resolve keyid for directory signature')
  }

  const created = Math.floor(Date.now() / 1000)
  const expires = created + WEB_BOT_AUTH_SIGNATURE_MAX_AGE
  const authority = new URL(request.url).host

  const signedHeaders = await signDirectoryResponse({
    authority,
    keyId,
    created,
    expires,
    privateKey
  })

  const body = JSON.stringify(jwks, null, 2) + '\\n'
  const headers = new Headers({
    'Content-Type': 'application/http-message-signatures-directory+json',
    'Cache-Control': 'public, max-age=60',
    Signature: signedHeaders.signature,
    'Signature-Input': signedHeaders.signatureInput
  })

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers })
  }

  return new Response(body, { status: 200, headers })
}

function wantsMarkdown (request) {
  const accept = (request.headers.get('accept') || '').toLowerCase()
  return accept.includes('text/markdown')
}

function estimateTokens (markdown = '') {
  return Math.max(1, Math.ceil(markdown.length / 4))
}

function shouldBypass (pathname) {
  if (pathname === '/mcp' || pathname.startsWith('/mcp/')) return true
  if (pathname === '/assistant' || pathname.startsWith('/assistant/')) return true
  if (pathname.startsWith('/.well-known/')) return true
  return /\\.(js|css|map|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|xml|json|txt)$/i.test(pathname)
}

function resolveMarkdownPath (pathname, lang) {
  if (!pathname) return null
  if (pathname.endsWith('.md')) return pathname
  if (pathname === '/' || pathname === '/index.html') return '/homepage.' + lang + '.md'

  let clean = pathname
  if (clean.endsWith('/index.html')) clean = clean.slice(0, -11)
  if (clean.endsWith('/')) clean = clean.slice(0, -1)

  if (!clean) return '/homepage.' + lang + '.md'
  if (clean.endsWith('/overview') || clean.endsWith('/showcase') || clean.endsWith('/vs')) {
    return clean + '.md'
  }

  return clean + '/overview.md'
}

export async function onRequest (context) {
  const { request, env, next } = context

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next()
  }

  const url = new URL(request.url)
  const webBotAuthResponse = await handleWebBotAuthDirectory(request, env, url.pathname)
  if (webBotAuthResponse) {
    return webBotAuthResponse
  }

  if (!MARKDOWN_ENABLED) {
    return next()
  }

  if (shouldBypass(url.pathname)) {
    return next()
  }

  const ua = request.headers.get('user-agent') || ''
  const acceptMarkdown = wantsMarkdown(request)
  const fallbackMarkdown = AGENT_FALLBACK && LLM_BOT_PATTERN.test(ua)
  if (!acceptMarkdown && !fallbackMarkdown) {
    return next()
  }

  const lang = url.searchParams.get('lang') || DEFAULT_LANG
  const markdownPath = resolveMarkdownPath(url.pathname, lang)
  if (!markdownPath) {
    return next()
  }

  const markdownUrl = new URL(url.toString())
  markdownUrl.pathname = markdownPath
  const markdownRequest = new Request(markdownUrl.toString(), request)
  const markdownResponse = await env.ASSETS.fetch(markdownRequest)
  if (!markdownResponse.ok) {
    return next()
  }

  const markdown = await markdownResponse.text()
  const headers = new Headers(markdownResponse.headers)
  headers.set('Content-Type', 'text/markdown; charset=utf-8')
  const vary = headers.get('Vary')
  headers.set('Vary', vary ? vary + ', Accept' : 'Accept')
  headers.set('x-markdown-tokens', String(estimateTokens(markdown)))

  if (request.method === 'HEAD') {
    return new Response(null, { status: markdownResponse.status, headers })
  }

  return new Response(markdown, { status: markdownResponse.status, headers })
}
`

        writeFileSync(resolve(functionsDir, '_middleware.js'), middlewareCode)
        console.log(`\x1b[36m[docsector]\x1b[0m Generated runtime middleware at functions/_middleware.js`)
      }

      if (contentSignalsEnabled) {
        const robotsPath = resolve(distDir, 'robots.txt')
        const existingRobots = existsSync(robotsPath)
          ? readFileSync(robotsPath, 'utf-8')
          : 'User-agent: *\nAllow: /\n'
        const contentSignalLine = buildContentSignalLine(contentSignalsConfig)
        const patchedRobots = applyContentSignalsToRobots(existingRobots, {
          contentSignalLine,
          userAgent: contentSignalsConfig.userAgent || '*',
          applyToAllBlocks: contentSignalsConfig.applyToAllBlocks === true
        })

        if (patchedRobots !== existingRobots) {
          writeFileSync(robotsPath, patchedRobots)
          console.log(`\x1b[36m[docsector]\x1b[0m Updated robots.txt with Content-Signal policy`)
        }
      }

      const robotsSitemapPaths = getAdvertisedRobotsSitemapPaths({ sitemapEnabled })

      if (robotsSitemapPaths.length > 0) {
        const robotsPath = resolve(distDir, 'robots.txt')
        const existingRobots = existsSync(robotsPath)
          ? readFileSync(robotsPath, 'utf-8')
          : 'User-agent: *\nAllow: /\n'
        const patchedRobots = appendSitemapsToRobots(existingRobots, {
          sitemaps: robotsSitemapPaths,
          siteUrl
        })

        if (patchedRobots !== existingRobots) {
          writeFileSync(robotsPath, patchedRobots)
          console.log(`\x1b[36m[docsector]\x1b[0m Updated robots.txt with sitemap discovery`)
        }
      }

      if (agentSkillsEnabled) {
        const agentSkillsPath = agentSkillsConfig.path || '/.well-known/agent-skills/index.json'
        const agentSkillsSchema = agentSkillsConfig.schema || 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
        const indexDistPath = normalizeLocalPath(agentSkillsPath)

        if (!indexDistPath) {
          console.warn(`\x1b[33m[docsector]\x1b[0m Skipped Agent Skills index generation: path must be a local URI path, got "${agentSkillsPath}"`)
        } else {
          const indexHref = agentSkillsPath.startsWith('/') ? agentSkillsPath : `/${agentSkillsPath}`
          const configuredSkills = Array.isArray(agentSkillsConfig.skills)
            ? agentSkillsConfig.skills
            : []

          const normalizedSkills = configuredSkills.map((skill, index) => {
            if (!skill || typeof skill !== 'object') {
              throw new Error(`[docsector] agentSkills.skills[${index}] must be an object`)
            }

            const name = String(skill.name || '').trim().toLowerCase()
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
              throw new Error(`[docsector] agentSkills.skills[${index}].name must be lowercase alphanumeric and hyphen-separated`)
            }

            const type = normalizeAgentSkillType(skill.type, index)
            const description = String(skill.description || '').trim()
            if (!description) {
              throw new Error(`[docsector] agentSkills.skills[${index}].description is required`)
            }

            const url = toUrl(skill.url)
            if (!url) {
              throw new Error(`[docsector] agentSkills.skills[${index}].url is required`)
            }

            let digest = normalizeAgentSkillDigest(skill.digest)
            if (!digest) {
              const artifactPath = resolveAgentSkillArtifactPath(url, { siteUrl, distDir })
              if (!artifactPath || !existsSync(artifactPath)) {
                throw new Error(`[docsector] Unable to compute digest for agentSkills.skills[${index}] (${name}). Artifact not found at ${url}`)
              }
              const artifactContents = readFileSync(artifactPath)
              digest = `sha256:${createHash('sha256').update(artifactContents).digest('hex')}`
            }

            return {
              name,
              type,
              description,
              url,
              digest
            }
          })

          const agentSkillsIndex = {
            $schema: agentSkillsSchema,
            skills: normalizedSkills
          }

          const indexDir = resolve(distDir, indexDistPath, '..')
          mkdirSync(indexDir, { recursive: true })
          writeFileSync(
            resolve(distDir, indexDistPath),
            JSON.stringify(agentSkillsIndex, null, 2) + '\n'
          )
          console.log(`\x1b[36m[docsector]\x1b[0m Generated ${indexHref}`)

          const headersWithSkills = readFileSync(headersPath, 'utf-8')
          if (!headersWithSkills.includes(indexHref)) {
            const skillsHeaders = `${indexHref}\n  Content-Type: application/json; charset=utf-8\n`
            writeFileSync(headersPath, headersWithSkills.trimEnd() + '\n\n' + skillsHeaders)
            console.log(`\x1b[36m[docsector]\x1b[0m Added _headers rule for ${indexHref}`)
          }
        }
      }

      if (mcpServerCardEnabled) {
        if (!config.mcp) {
          console.warn('\x1b[33m[docsector]\x1b[0m Skipped MCP Server Card generation: mcp config is not enabled')
        } else {
          const mcpServerCardPath = mcpServerCardConfig.path || '/.well-known/mcp/server-card.json'
          const cardDistPath = normalizeLocalPath(mcpServerCardPath)

          if (!cardDistPath) {
            console.warn(`\x1b[33m[docsector]\x1b[0m Skipped MCP Server Card generation: path must be a local URI path, got "${mcpServerCardPath}"`)
          } else {
            const cardHref = mcpServerCardPath.startsWith('/') ? mcpServerCardPath : `/${mcpServerCardPath}`
            const mcpServerName = config.mcp.serverName || config.branding?.name || 'docs'
            const mcpServerVersion = config.branding?.version || '1.0.0'
            const mcpToolSuffix = config.mcp.toolSuffix || 'docs'
            const transportEndpoint = mcpServerCardConfig.transportEndpoint || '/mcp'
            const endpoint = toUrl(transportEndpoint)

            if (!endpoint) {
              console.warn('\x1b[33m[docsector]\x1b[0m Skipped MCP Server Card generation: unable to resolve transport endpoint URL')
            } else {
              const cardPayload = buildMcpServerCardPayload({
                config,
                mcpServerCardConfig,
                serverName: mcpServerName,
                serverVersion: mcpServerVersion,
                endpoint,
                toolSuffix: mcpToolSuffix
              })

              const cardDir = resolve(distDir, cardDistPath, '..')
              mkdirSync(cardDir, { recursive: true })
              writeFileSync(
                resolve(distDir, cardDistPath),
                JSON.stringify(cardPayload, null, 2) + '\n'
              )
              console.log(`\x1b[36m[docsector]\x1b[0m Generated ${cardHref}`)

              const headersWithServerCard = readFileSync(headersPath, 'utf-8')
              if (!headersWithServerCard.includes(cardHref)) {
                const serverCardHeaders = `${cardHref}\n  Content-Type: application/json; charset=utf-8\n`
                writeFileSync(headersPath, headersWithServerCard.trimEnd() + '\n\n' + serverCardHeaders)
                console.log(`\x1b[36m[docsector]\x1b[0m Added _headers rule for ${cardHref}`)
              }
            }
          }
        }
      }

      console.log(`\x1b[36m[docsector]\x1b[0m Added _headers rule for .md files`)

      // Add homepage Link headers for agent discovery (RFC 8288 / RFC 9727)
      const linkHeadersConfig = config.linkHeaders || {}
      const linkHeadersEnabled = linkHeadersConfig.enabled !== false

      if (linkHeadersEnabled) {
        const homepageLinks = []

        const serviceDocHref = linkHeadersConfig.serviceDoc === undefined
          ? '/'
          : linkHeadersConfig.serviceDoc
        if (serviceDocHref) {
          homepageLinks.push({ rel: 'service-doc', href: serviceDocHref })
        }

        const apiCatalogHref = linkHeadersConfig.apiCatalog === undefined
          ? '/.well-known/api-catalog'
          : linkHeadersConfig.apiCatalog
        if (apiCatalogHref) {
          homepageLinks.push({ rel: 'api-catalog', href: apiCatalogHref })
        }

        const serviceDescHref = linkHeadersConfig.serviceDesc === undefined
          ? '/mcp'
          : linkHeadersConfig.serviceDesc
        if (config.mcp && serviceDescHref) {
          homepageLinks.push({ rel: 'service-desc', href: serviceDescHref })
        }

        const describedByHref = linkHeadersConfig.describedBy === undefined
          ? '/llms.txt'
          : linkHeadersConfig.describedBy
        if (siteUrl && describedByHref) {
          homepageLinks.push({ rel: 'describedby', href: describedByHref })
        }

        if (homepageLinks.length > 0) {
          const currentHeaders = readFileSync(headersPath, 'utf-8')
          const missingHomepageLinks = homepageLinks.filter(({ rel }) => !currentHeaders.includes(`rel="${rel}"`))

          if (missingHomepageLinks.length > 0) {
            const linkLines = missingHomepageLinks
              .map(({ rel, href }) => `  Link: <${href}>; rel="${rel}"`)
              .join('\n')
            const homepageRule = ['/', '/index.html']
              .map(path => `${path}\n${linkLines}`)
              .join('\n\n') + '\n'

            writeFileSync(headersPath, currentHeaders.trimEnd() + '\n\n' + homepageRule)
            console.log(`\x1b[36m[docsector]\x1b[0m Added homepage Link headers for agent discovery (${missingHomepageLinks.length} relation(s))`)
          }
        }

        // Generate /.well-known/api-catalog Linkset document (RFC 9727)
        const apiCatalogConfig = config.apiCatalog || {}
        const apiCatalogEnabled = apiCatalogConfig.enabled !== false
        const apiCatalogPath = (apiCatalogConfig.path || apiCatalogHref || '/.well-known/api-catalog')

        if (apiCatalogEnabled && apiCatalogPath) {
          const catalogDistPath = normalizeLocalPath(apiCatalogPath)

          if (catalogDistPath) {
            const catalogHref = apiCatalogPath.startsWith('/') ? apiCatalogPath : `/${apiCatalogPath}`
            const catalogEntry = {
              anchor: toUrl(catalogHref)
            }

            const catalogServiceDoc = toUrl(serviceDocHref)
            if (catalogServiceDoc) {
              catalogEntry['service-doc'] = [{ href: catalogServiceDoc }]
            }

            const catalogServiceDesc = config.mcp ? toUrl(serviceDescHref) : null
            if (catalogServiceDesc) {
              catalogEntry['service-desc'] = [{ href: catalogServiceDesc }]
            }

            const catalogDescribedBy = siteUrl ? toUrl(describedByHref) : null
            if (catalogDescribedBy) {
              catalogEntry.describedby = [{ href: catalogDescribedBy }]
            }

            const customItems = Array.isArray(apiCatalogConfig.items)
              ? apiCatalogConfig.items
              : []
            const itemHrefs = new Set()

            if (catalogServiceDesc) {
              itemHrefs.add(catalogServiceDesc)
            }

            for (const item of customItems) {
              if (typeof item === 'string') {
                const href = toUrl(item)
                if (href) itemHrefs.add(href)
                continue
              }

              if (item && typeof item === 'object' && typeof item.href === 'string') {
                const href = toUrl(item.href)
                if (href) itemHrefs.add(href)
              }
            }

            if (itemHrefs.size > 0) {
              catalogEntry.item = [...itemHrefs].map(href => ({ href }))
            }

            const catalogDir = resolve(distDir, catalogDistPath, '..')
            mkdirSync(catalogDir, { recursive: true })
            writeFileSync(
              resolve(distDir, catalogDistPath),
              JSON.stringify({ linkset: [catalogEntry] }, null, 2) + '\n'
            )
            console.log(`\x1b[36m[docsector]\x1b[0m Generated ${catalogHref}`)

            const headersWithLinks = readFileSync(headersPath, 'utf-8')
            if (!headersWithLinks.includes(catalogHref)) {
              const apiCatalogHeaders = `${catalogHref}\n  Content-Type: application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"\n`
              writeFileSync(headersPath, headersWithLinks.trimEnd() + '\n\n' + apiCatalogHeaders)
              console.log(`\x1b[36m[docsector]\x1b[0m Added _headers rule for ${catalogHref}`)
            }
          } else {
            console.warn(`\x1b[33m[docsector]\x1b[0m Skipped API catalog generation: path must be a local URI path, got "${apiCatalogPath}"`)
          }
        }
      }

      // Generate MCP server if configured
      if (config.mcp) {
        const mcpConfig = config.mcp
        const mcpServerName = mcpConfig.serverName || 'docs'
        const mcpToolSuffix = mcpConfig.toolSuffix || 'docs'
        const mcpVersion = config.branding?.version || '1.0.0'

        // Collect page index for MCP
        const mcpPages = []
        for (const entry of pageEntries) {
          const { book, pagePath, page } = entry
          if (page.config === null) continue
          if (page.config.status === 'empty') continue

          const defaultTitle = page.data?.['*']?.title
            || page.data?.[defaultLang]?.title
            || page.data?.['en-US']?.title
            || pagePath.split('/').pop()
            || pagePath

          const subpageList = ['overview']
          if (page.config.subpages?.showcase) subpageList.push('showcase')
          if (page.config.subpages?.vs) subpageList.push('vs')

          for (const subpage of subpageList) {
            const srcFile = resolveMarkdownSourceFile(pagesDir, entry, subpage, defaultLang)
            if (!existsSync(srcFile)) continue

            mcpPages.push({
              path: buildPageRoutePath(entry, subpage),
              title: defaultTitle,
              book,
              version: entry.version,
              type: book,
              subpage
            })
          }
        }

        // Write mcp-pages.json
        writeFileSync(
          resolve(distDir, 'mcp-pages.json'),
          JSON.stringify(mcpPages, null, 2)
        )
        console.log(`\x1b[36m[docsector]\x1b[0m Generated mcp-pages.json (${mcpPages.length} pages)`)

        // Read server template from package, replace placeholders, write to project root functions/
        // Cloudflare Pages expects functions/ in the project root, not inside dist/spa/
        const packageRoot = getPackageRoot(projectRoot)
        const templatePath = resolve(packageRoot, 'src', 'mcp', 'server.js')
        if (existsSync(templatePath)) {
          // Replacer functions, not plain strings: `$&`, `` $` `` and `$'` in a
          // consumer-supplied value would otherwise be interpolated.
          let serverCode = readFileSync(templatePath, 'utf-8')
          serverCode = serverCode
            .replaceAll('__MCP_SERVER_NAME__', () => mcpServerName)
            .replaceAll('__MCP_SERVER_VERSION__', () => mcpVersion)
            .replaceAll('__MCP_TOOL_SUFFIX__', () => mcpToolSuffix)
            .replaceAll('__MCP_SITE_URL__', () => siteUrl || '')

          const functionsDir = resolve(projectRoot, 'functions')
          mkdirSync(functionsDir, { recursive: true })
          writeFileSync(resolve(functionsDir, 'mcp.js'), serverCode)
          console.log(`\x1b[36m[docsector]\x1b[0m Generated MCP server at functions/mcp.js`)
        }

        // Add CORS headers for /mcp to _headers
        const mcpHeaders = '/mcp\n  Access-Control-Allow-Origin: *\n  Access-Control-Allow-Methods: GET, POST, OPTIONS\n  Access-Control-Allow-Headers: Content-Type, Accept, Mcp-Session-Id\n  Access-Control-Expose-Headers: Mcp-Session-Id\n'
        const currentHeaders = readFileSync(headersPath, 'utf-8')
        if (!currentHeaders.includes('/mcp')) {
          writeFileSync(headersPath, currentHeaders.trimEnd() + '\n\n' + mcpHeaders)
        }

      }

      // Generate or merge _routes.json for Cloudflare Pages functions
      if (config.mcp || aiAssistantEnabled || markdownNegotiationEnabled || webBotAuthEnabled) {
        const routesPath = resolve(distDir, '_routes.json')
        let routes = { version: 1, include: [], exclude: [] }
        if (existsSync(routesPath)) {
          try {
            routes = JSON.parse(readFileSync(routesPath, 'utf-8'))
          } catch {
            // empty
          }
        }

        if (markdownNegotiationEnabled && !routes.include.includes('/*')) {
          routes.include.push('/*')
        }

        if (config.mcp && !markdownNegotiationEnabled && !routes.include.includes('/mcp')) {
          routes.include.push('/mcp')
        }

        if (aiAssistantEnabled && !markdownNegotiationEnabled && !routes.include.includes('/assistant')) {
          routes.include.push('/assistant')
        }

        if (webBotAuthEnabled && !markdownNegotiationEnabled && !routes.include.includes(webBotAuthDirectoryPath)) {
          routes.include.push(webBotAuthDirectoryPath)
        }

        // Cloudflare Pages rejects overlapping include rules (e.g. "/mcp" with "/*").
        // Keep only the catch-all when markdown negotiation is enabled.
        if (routes.include.includes('/*')) {
          routes.include = ['/*']
        }

        const markdownExcludes = [
          '/assets/*',
          '/*.js',
          '/*.css',
          '/*.png',
          '/*.jpg',
          '/*.jpeg',
          '/*.gif',
          '/*.webp',
          '/*.svg',
          '/*.ico',
          '/*.woff',
          '/*.woff2',
          '/*.ttf',
          '/*.map'
        ]

        for (const excludePath of markdownExcludes) {
          if (!routes.exclude.includes(excludePath)) {
            routes.exclude.push(excludePath)
          }
        }

        writeFileSync(routesPath, JSON.stringify(routes, null, 2))
        console.log(`\x1b[36m[docsector]\x1b[0m Updated _routes.json for functions runtime`)
      }
    }
  }
}

function normalizeContentSignalValue (value, fallback = 'yes') {
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'yes' || normalized === 'no') return normalized
  }
  return fallback
}

function buildContentSignalLine (contentSignalsConfig = {}) {
  const aiTrain = normalizeContentSignalValue(contentSignalsConfig.aiTrain, 'yes')
  const search = normalizeContentSignalValue(contentSignalsConfig.search, 'yes')
  const aiInput = normalizeContentSignalValue(contentSignalsConfig.aiInput, 'yes')
  return `Content-Signal: ai-train=${aiTrain}, search=${search}, ai-input=${aiInput}`
}

function ensureContentSignalInBlock (blockLines, contentSignalLine) {
  const cleanedBlock = blockLines.filter((line, index) => {
    if (index === 0) return true
    return !/^\s*Content-Signal\s*:/i.test(line)
  })

  let insertAt = cleanedBlock.findIndex(line => /^\s*Allow\s*:/i.test(line))
  if (insertAt === -1) {
    insertAt = 0
  }

  cleanedBlock.splice(insertAt + 1, 0, contentSignalLine)
  return cleanedBlock
}

function applyContentSignalsToRobots (robotsContent, { contentSignalLine, userAgent = '*', applyToAllBlocks = false }) {
  const input = typeof robotsContent === 'string' ? robotsContent : ''
  const lines = input.replace(/\r\n/g, '\n').split('\n')
  const userAgentIndexes = []

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*User-agent\s*:/i.test(lines[i])) {
      userAgentIndexes.push(i)
    }
  }

  if (userAgentIndexes.length === 0) {
    const scaffold = [
      `User-agent: ${userAgent}`,
      'Allow: /',
      contentSignalLine,
      ''
    ].join('\n')
    return scaffold.endsWith('\n') ? scaffold : scaffold + '\n'
  }

  const targetIndexes = []
  for (const startIndex of userAgentIndexes) {
    const uaValue = lines[startIndex].split(':').slice(1).join(':').trim()
    if (applyToAllBlocks || uaValue.toLowerCase() === String(userAgent).toLowerCase()) {
      targetIndexes.push(startIndex)
    }
  }

  if (targetIndexes.length === 0) {
    targetIndexes.push(userAgentIndexes[0])
  }

  let updated = []
  let cursor = 0

  for (const startIndex of targetIndexes) {
    const nextUserAgent = userAgentIndexes.find(index => index > startIndex)
    const endIndex = nextUserAgent === undefined ? lines.length : nextUserAgent

    updated = updated.concat(lines.slice(cursor, startIndex))
    const currentBlock = lines.slice(startIndex, endIndex)
    updated = updated.concat(ensureContentSignalInBlock(currentBlock, contentSignalLine))
    cursor = endIndex
  }

  updated = updated.concat(lines.slice(cursor))
  return updated.join('\n').replace(/\n+$/g, '') + '\n'
}

function normalizeAgentSkillType (type, index) {
  const normalizedType = String(type || '').trim()
  if (normalizedType !== 'skill-md' && normalizedType !== 'archive') {
    throw new Error(`[docsector] agentSkills.skills[${index}].type must be "skill-md" or "archive"`)
  }
  return normalizedType
}

function normalizeAgentSkillDigest (digest) {
  if (digest === null || digest === undefined || digest === '') return null
  const normalizedDigest = String(digest).trim().toLowerCase()
  if (!/^sha256:[a-f0-9]{64}$/.test(normalizedDigest)) {
    throw new Error('[docsector] agentSkills.skills[*].digest must follow "sha256:{hex}"')
  }
  return normalizedDigest
}

function resolveAgentSkillArtifactPath (artifactUrl, { siteUrl, distDir }) {
  if (!artifactUrl || typeof artifactUrl !== 'string') {
    return null
  }

  let pathname = null

  if (/^https?:\/\//i.test(artifactUrl)) {
    if (!siteUrl) return null

    let artifact
    let base
    try {
      artifact = new URL(artifactUrl)
      base = new URL(siteUrl)
    } catch {
      return null
    }

    if (artifact.origin !== base.origin) {
      return null
    }

    pathname = artifact.pathname
  } else {
    pathname = artifactUrl.startsWith('/') ? artifactUrl : `/${artifactUrl}`
  }

  const relativePath = pathname.replace(/^\/+/, '')
  if (!relativePath) return null

  return resolve(distDir, relativePath)
}

function mergeObjects (base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return base
  }

  return { ...base, ...override }
}

function buildMcpServerCardPayload ({
  config,
  mcpServerCardConfig,
  serverName,
  serverVersion,
  endpoint,
  toolSuffix
}) {
  const transportType = mcpServerCardConfig.transportType || 'streamable-http'
  const protocolVersion = mcpServerCardConfig.protocolVersion || '2025-03-26'
  const baseTools = [
    `search_${toolSuffix}`,
    `get_page_${toolSuffix}`
  ]

  const defaultCapabilities = {
    tools: {
      supported: true,
      names: baseTools
    },
    resources: {
      supported: false
    },
    prompts: {
      supported: false
    }
  }

  const capabilitiesOverride = (mcpServerCardConfig.capabilities && typeof mcpServerCardConfig.capabilities === 'object' && !Array.isArray(mcpServerCardConfig.capabilities))
    ? mcpServerCardConfig.capabilities
    : {}
  const capabilities = {
    ...capabilitiesOverride,
    tools: mergeObjects(defaultCapabilities.tools, capabilitiesOverride.tools),
    resources: mergeObjects(defaultCapabilities.resources, capabilitiesOverride.resources),
    prompts: mergeObjects(defaultCapabilities.prompts, capabilitiesOverride.prompts)
  }

  const primaryRemote = {
    transportType,
    endpoint,
    supportedProtocolVersions: [protocolVersion]
  }

  const customRemotes = Array.isArray(mcpServerCardConfig.remotes)
    ? mcpServerCardConfig.remotes
    : []
  const remotes = [primaryRemote, ...customRemotes]

  const payload = {
    serverInfo: {
      name: serverName,
      version: serverVersion
    },
    title: config.branding?.name || serverName,
    description: config.branding?.description || null,
    transport: {
      type: transportType,
      endpoint
    },
    remotes,
    capabilities,
    tools: baseTools.map(name => ({ name }))
  }

  const metadata = mcpServerCardConfig.metadata
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return { ...payload, ...metadata }
  }

  return payload
}

/**
 * Create a Vite plugin that injects the pre-paint theme script into index.html.
 *
 * The script (see src/theme.inline.js) stamps `body--light`/`body--dark` from
 * the reader's stored preference — or their OS — while the page is still being
 * parsed, so no reader ever sees a flash of the wrong theme.
 *
 * Injecting via `transformIndexHtml` rather than shipping the script inside
 * index.html is deliberate: consumer projects own their own index.html (so a
 * hand-edit would reach nobody), and Quasar's own html plugin runs its EJS
 * template compile in an `enforce: 'pre'` hook — injecting from a default-order
 * hook lands after it, keeping the script safe from `<%= %>` interpolation.
 */
function createThemeBootPlugin () {
  return {
    name: 'docsector-theme-boot',
    transformIndexHtml () {
      return [
        {
          tag: 'script',
          children: THEME_INLINE_SCRIPT,
          injectTo: 'body-prepend'
        }
      ]
    }
  }
}

/**
 * Create a Vite plugin that emits `version.json` into the build output.
 *
 * The file carries the same build ID that `extendViteConf` bakes into the
 * client bundle as `__DOCSECTOR_BUILD__`. The running SPA polls it to detect
 * that a newer deploy is live (see src/composables/useUpdateCheck.js).
 * A `Cache-Control: no-cache` rule is appended to `_headers` so CDNs
 * (Cloudflare Pages) always revalidate the file instead of caching it.
 */
function createVersionFilePlugin (projectRoot, buildId) {
  return {
    name: 'docsector-version-file',
    apply: 'build',
    closeBundle () {
      const distDir = resolve(projectRoot, 'dist', 'spa')
      if (!existsSync(distDir)) return

      writeFileSync(
        resolve(distDir, 'version.json'),
        JSON.stringify({ build: buildId, generatedAt: new Date().toISOString() }, null, 2) + '\n'
      )

      const headersPath = resolve(distDir, '_headers')
      const headersRule = '/version.json\n  Cache-Control: no-cache\n'
      if (existsSync(headersPath)) {
        const existing = readFileSync(headersPath, 'utf-8')
        if (!existing.includes('/version.json')) {
          writeFileSync(headersPath, existing.trimEnd() + '\n\n' + headersRule)
        }
      } else {
        writeFileSync(headersPath, headersRule)
      }

      console.log(`\x1b[36m[docsector]\x1b[0m Generated version.json (build ${buildId})`)
    }
  }
}

/**
 * Create a complete Quasar configuration for a docsector-reader consumer project.
 *
 * In **standalone** mode (docsector-reader running itself), all paths resolve
 * naturally via Quasar defaults — no alias overrides needed.
 *
 * In **consumer** mode (installed as a dependency), Vite aliases redirect
 * engine internals (components, layouts, composables, boot) to the package
 * while content paths (pages, src/i18n) stay in the consumer project.
 *
 * Boot file resolution trick:
 *   - boot/store, boot/QZoom, boot/axios → package (relative imports: ../store/, ../components/)
 *   - boot/i18n → package file, BUT it imports 'src/i18n' which Quasar aliases to consumer's src/
 *
 * @param {Object} options - Configuration options
 * @param {string} options.projectRoot - Absolute path to the consumer project root
 * @param {number} [options.port=8181] - Dev server port
 * @param {Object} [options.pwa] - PWA manifest overrides (merged with defaults)
 * @param {Array} [options.vitePlugins=[]] - Additional Vite plugins to include
 * @param {Array} [options.boot=[]] - Additional boot files to include
 * @param {Function} [options.extendViteConf] - Additional Vite configuration callback
 * @returns {Object} Complete Quasar configuration object
 */
export function createQuasarConfig (options = {}) {
  const {
    projectRoot = process.cwd(),
    port = 8181,
    pwa = {},
    vitePlugins = [],
    boot: extraBoot = [],
    extendViteConf: userExtendViteConf
  } = options

  const packageRoot = getPackageRoot(projectRoot)
  const isStandalone = projectRoot === packageRoot

  // Build ID for stale-session detection — stable per deploy (Cloudflare Pages
  // commit SHA), overridable via DOCSECTOR_BUILD_ID, unique per build otherwise.
  // Baked into the client bundle (extendViteConf) AND emitted as version.json
  // (createVersionFilePlugin) so the running SPA can compare the two.
  const buildId = process.env.CF_PAGES_COMMIT_SHA
    || process.env.DOCSECTOR_BUILD_ID
    || new Date().toISOString()

  return {
    // Boot files — Quasar resolves these via 'boot/<name>' imports.
    // Since the 'boot' alias points to packageRoot/src/boot/ in consumer mode,
    // consumer-specific boot files are resolved via per-file Vite aliases
    // added in extendViteConf below.
    boot: [
      'icons',
      'store',
      'QZoom',
      'i18n',
      'axios',
      ...extraBoot
    ],

    // CSS — Quasar resolves from src/css/
    css: [
      'app.sass'
    ],

    // Icon fonts are intentionally absent: material icons ship as a
    // tree-shaken SVG subset (virtual:docsector-icons + boot/icons.js) and
    // the few FontAwesome glyphs are inlined SVG imports — together that
    // saves ~280 KB of webfonts on every page load.
    extras: [
      'roboto-font'
    ],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },

      vueRouterMode: 'history',

      vitePlugins: [
        createBooksPlugin(projectRoot),
        createCodeExamplesPlugin(),
        createTerminalsPlugin(),
        createFontDisplayPlugin(),
        createIconsPlugin(projectRoot),
        createRoutePreloadPlugin(),
        createHjsonPlugin(),
        createHomePageOverridePlugin(projectRoot),
        createGitDatesPlugin(projectRoot),
        createMarkdownEndpointPlugin(projectRoot),
        createMarkdownBuildPlugin(projectRoot),
        createPrerenderMetaPlugin(projectRoot),
        createVersionFilePlugin(projectRoot, buildId),
        createThemeBootPlugin(),
        ...vitePlugins
      ],

      extendViteConf (viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = viteConf.resolve.alias || {}

        // Bake the build ID into the client bundle as a compile-time constant.
        // The SPA compares it against the deployed version.json to detect that
        // a newer build is live (see src/composables/useUpdateCheck.js).
        viteConf.define = {
          ...(viteConf.define || {}),
          __DOCSECTOR_BUILD__: JSON.stringify(buildId)
        }

        // When the pages watcher plugin triggers a restart, it sets this env
        // flag so we force Vite to generate a fresh browserHash. This busts
        // the browser's module cache for pre-bundled deps whose content changed.
        viteConf.optimizeDeps = viteConf.optimizeDeps || {}
        if (process.env.__DOCSECTOR_FORCE_OPTIMIZE) {
          delete process.env.__DOCSECTOR_FORCE_OPTIMIZE
          viteConf.optimizeDeps.force = true
        }

        // Include a hash of page registry definition files (legacy index.js,
        // plus *.book.js and *.index.js) in optimizer config so Vite's
        // configHash/browserHash changes whenever routes/books are edited.
        const pagesRegistryFiles = getPagesRegistryFiles(projectRoot)
        if (pagesRegistryFiles.length > 0) {
          const pagesHashBuilder = createHash('sha256')
          for (const file of pagesRegistryFiles) {
            pagesHashBuilder
              .update(file)
              .update(readFileSync(file))
          }

          const pagesHash = createHash('sha256')
            .update(pagesHashBuilder.digest('hex'))
            .digest('hex')
            .slice(0, 8)

          viteConf.optimizeDeps.esbuildOptions = viteConf.optimizeDeps.esbuildOptions || {}
          viteConf.optimizeDeps.esbuildOptions.define = {
            ...(viteConf.optimizeDeps.esbuildOptions.define || {}),
            __DOCSECTOR_PAGES_HASH__: JSON.stringify(pagesHash)
          }
        }

        // Deduplicate Vue ecosystem packages to prevent dual-instance issues.
        // When the package is installed from NPM, Vue, vue-router, vuex, etc.
        // can end up duplicated (one copy in consumer's node_modules, another
        // nested inside the package). This causes useRoute(), useStore(), etc.
        // to return undefined because they inject from a different Vue instance.
        viteConf.resolve.dedupe = [
          ...(viteConf.resolve.dedupe || []),
          'vue', 'vue-router', 'vuex', 'vue-i18n', 'quasar', '@quasar/extras'
        ]

        // Force Vite to pre-bundle Vue ecosystem packages.
        // Vite's dep scanner only discovers bare imports from source files,
        // not from .vue files inside node_modules. Without this, vue-router,
        // vuex and vue-i18n are served as raw ESM modules while the router
        // entry (which IS pre-bundled) gets its OWN copy of these libraries
        // baked into its chunk — creating two separate JS module instances
        // with different Symbols. This breaks inject/provide: useRoute(),
        // useStore(), useI18n() all return undefined.
        // CJS packages (prismjs, markdown-it, etc.) also need explicit
        // inclusion to be properly converted to ESM by Vite's optimizer.
        viteConf.optimizeDeps = viteConf.optimizeDeps || {}
        viteConf.optimizeDeps.include = [
          ...(viteConf.optimizeDeps.include || []),
          'vue', 'vue-router', 'vuex', 'vue-i18n',
          'prismjs', 'markdown-it', 'markdown-it-attrs',
          'markdown-it-task-lists', 'markdown-it-texmath',
          'hjson', 'q-colorize-mixin', 'mermaid'
        ]

        // Exclude boot files and Docsector runtime entry points from pre-bundling.
        // Boot files (especially boot/i18n) import the consumer's src/i18n/index.js
        // which uses import.meta.glob — a compile-time Vite directive that only
        // works in source files. If pre-bundled, the glob calls become dead code
        // and no i18n messages are loaded.
        // In consumer mode, the package router also imports Vite virtual modules
        // and consumer content via the `pages` alias. If pre-bundled, Vite can
        // try resolving those virtual IDs before Docsector's plugins handle them,
        // or embed stale consumer registry content in the optimizer cache.
        viteConf.optimizeDeps.exclude = [
          ...(viteConf.optimizeDeps.exclude || []),
          'boot/i18n', 'boot/icons', 'boot/store', 'boot/QZoom', 'boot/axios',
          ...(!isStandalone ? DOCSECTOR_CONSUMER_OPTIMIZE_DEPS_EXCLUDE : [])
        ]

        if (!isStandalone) {
          // --- Consumer project mode ---
          // Allow Vite to serve files from the package root (needed for symlinked/npm-linked packages)
          viteConf.server = viteConf.server || {}
          viteConf.server.fs = viteConf.server.fs || {}
          viteConf.server.fs.allow = viteConf.server.fs.allow || []
          viteConf.server.fs.allow.push(packageRoot, projectRoot)
          viteConf.server.fs.strict = false

          // Consumer boot files — per-file aliases must come BEFORE the general
          // 'boot' alias in the object, otherwise Vite matches 'boot' first.
          // We delete the pre-existing 'boot' alias (set by Quasar), add specific
          // entries, then re-add the general 'boot' alias after them.
          delete viteConf.resolve.alias.boot
          for (const bootName of extraBoot) {
            if (typeof bootName === 'string') {
              viteConf.resolve.alias[`boot/${bootName}`] = resolve(projectRoot, 'src/boot', bootName)
            }
          }

          // Engine internals from the package (components, layouts, composables, boot, css):
          viteConf.resolve.alias.components = resolve(packageRoot, 'src/components')
          viteConf.resolve.alias.layouts = resolve(packageRoot, 'src/layouts')
          viteConf.resolve.alias.composables = resolve(packageRoot, 'src/composables')
          viteConf.resolve.alias.boot = resolve(packageRoot, 'src/boot')
          viteConf.resolve.alias.css = resolve(packageRoot, 'src/css')
          viteConf.resolve.alias.stores = resolve(packageRoot, 'src/store')

          // Content from the consumer project:
          viteConf.resolve.alias.pages = resolve(projectRoot, 'src/pages')
        }

        // docsector.config.js — always from consumer/project root
        viteConf.resolve.alias['docsector.config.js'] = resolve(projectRoot, 'docsector.config.js')

        // Allow consumer to extend further
        if (typeof userExtendViteConf === 'function') {
          userExtendViteConf(viteConf)
        }
      }
    },

    // Source files — point App.vue, router, store to the package in consumer mode
    // Quasar prepends 'app/' to these, so use paths relative to projectRoot
    sourceFiles: isStandalone
      ? {}
      : {
          rootComponent: 'node_modules/@docsector/docsector-reader/src/App.vue',
          router: 'node_modules/@docsector/docsector-reader/src/router/index'
        },

    devServer: {
      port,
      open: false
    },

    framework: {
      // `dark: 'auto'` is a fail-safe, not the mechanism: src/theme-init.js
      // normally applies the reader's stored preference right after this value
      // is consumed at install time (and before the first paint). It only shows
      // through if theme-init fails — following the OS being the sane default.
      // It cannot carry the preference itself: Quasar serializes framework.config
      // with JSON.stringify, so it is always a build-time literal.
      config: { dark: 'auto' },
      lang: 'en-US',
      // SVG icons for Quasar internals — dynamic names resolve through the
      // iconMapFn registered in boot/icons.js
      iconSet: 'svg-material-icons',
      plugins: [
        'Meta', 'Notify', 'LocalStorage', 'SessionStorage'
      ]
    },

    animations: ['zoomIn', 'zoomOut'],

    pwa: {
      workboxMode: 'GenerateSW',
      manifest: {
        name: 'Documentation',
        short_name: 'Docs',
        description: 'Documentation powered by Docsector Reader.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#655529',
        icons: [
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        ...pwa
      }
    }
  }
}

export default createQuasarConfig
