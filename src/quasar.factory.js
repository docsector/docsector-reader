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
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import HJSON from 'hjson'

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

/**
 * List top-level page registry definition files.
 *
 * Includes:
 * - src/pages/index.js (legacy)
 * - src/pages/*.book.js
 * - src/pages/*.index.js
 */
function getPagesRegistryFiles (projectRoot) {
  const pagesDir = resolve(projectRoot, 'src', 'pages')
  if (!existsSync(pagesDir)) return []

  const names = readdirSync(pagesDir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)

  return names
    .filter(name => {
      if (name === 'index.js') return true
      return /^[^/]+\.book\.js$/.test(name) || /^[^/]+\.index\.js$/.test(name)
    })
    .sort()
    .map(name => resolve(pagesDir, name))
}

/**
 * Discover configured books from src/pages/*.book.js paired with *.index.js.
 */
function getBookRegistryEntries (projectRoot) {
  const pagesDir = resolve(projectRoot, 'src', 'pages')
  if (!existsSync(pagesDir)) return []

  const names = readdirSync(pagesDir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)

  const books = names
    .filter(name => /^[^/]+\.book\.js$/.test(name))
    .sort()

  const entries = []
  for (const bookFile of books) {
    const baseName = bookFile.slice(0, -'.book.js'.length)
    const indexFile = `${baseName}.index.js`
    if (!names.includes(indexFile)) continue

    entries.push({
      id: baseName,
      bookFile,
      indexFile,
      bookPath: resolve(pagesDir, bookFile),
      indexPath: resolve(pagesDir, indexFile)
    })
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
    return `import legacyPages from 'pages'

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

export const books = {
  manual: {
    config: defaultBook,
    routes: normalizedPages
  }
}

export const allBooks = [defaultBook]
export const allPages = normalizedPages

export default books
`
  }

  const imports = []
  const rows = []

  for (const [index, entry] of bookEntries.entries()) {
    imports.push(`import __book_${index} from 'pages/${entry.bookFile}'`)
    imports.push(`import __routes_${index} from 'pages/${entry.indexFile}'`)
    rows.push(`  { fallbackId: ${JSON.stringify(entry.id)}, config: __book_${index}, routes: __routes_${index} }`)
  }

  return `${imports.join('\n')}

const entries = [
${rows.join(',\n')}
]

const DEFAULT_BOOK_COLORS = Object.freeze({
  active: 'white',
  inactive: 'rgba(255, 255, 255, 0.72)'
})

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

export const books = entries.reduce((accumulator, entry, index) => {
  const config = entry.config || {}
  const resolvedId = config.id || entry.fallbackId || ('book-' + (index + 1))
  const label = config.label || (resolvedId.charAt(0).toUpperCase() + resolvedId.slice(1))
  const normalizedConfig = {
    ...config,
    id: resolvedId,
    label,
    icon: config.icon || 'menu_book',
    order: config.order ?? (index + 1),
    color: normalizeBookColor(config.color)
  }

  accumulator[resolvedId] = {
    config: normalizedConfig,
    routes: entry.routes || {}
  }
  return accumulator
}, {})

export const allBooks = Object.values(books).map(book => book.config)
export const allPages = Object.values(books).reduce((accumulator, book) => {
  return {
    ...accumulator,
    ...(book.routes || {})
  }
}, {})

export default books
`
}

/**
 * Load books and merged pages for build-time plugins (Node context).
 */
async function loadBooksRegistry (projectRoot) {
  const entries = getBookRegistryEntries(projectRoot)

  // Legacy fallback
  if (entries.length === 0) {
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
      }
    }

    return {
      books: {
        manual: {
          config: defaultBook,
          routes: pages
        }
      },
      allBooks: [defaultBook],
      allPages: pages
    }
  }

  const books = {}
  const allPages = {}

  for (const [index, entry] of entries.entries()) {
    const { default: rawConfig = {} } = await import(pathToFileURL(entry.bookPath).href)
    const { default: routes = {} } = await import(pathToFileURL(entry.indexPath).href)

    const resolvedId = rawConfig.id || entry.id || `book-${index + 1}`
    const label = rawConfig.label || (resolvedId.charAt(0).toUpperCase() + resolvedId.slice(1))

    const config = {
      ...rawConfig,
      id: resolvedId,
      label,
      icon: rawConfig.icon || 'menu_book',
      order: rawConfig.order ?? (index + 1),
      color: normalizeBookColorConfig(rawConfig.color)
    }

    books[resolvedId] = {
      config,
      routes
    }

    Object.assign(allPages, routes || {})
  }

  const allBooks = Object.values(books).map(book => book.config)

  return {
    books,
    allBooks,
    allPages
  }
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
  return /^[^/]+\.book\.js$/.test(relativePath) || /^[^/]+\.index\.js$/.test(relativePath)
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
  return {
    name: 'docsector-prerender-meta',
    apply: 'build',
    async closeBundle () {
      const distDir = resolve(projectRoot, 'dist', 'spa')
      const baseHtmlPath = resolve(distDir, 'index.html')
      if (!existsSync(baseHtmlPath)) return

      const baseHtml = readFileSync(baseHtmlPath, 'utf-8')

      // Dynamic import books registry and docsector config
      const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href

      const { allPages: pages } = await loadBooksRegistry(projectRoot)
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

      let count = 0

      for (const [pagePath, page] of Object.entries(pages)) {
        if (page.config === null) continue

        const book = resolvePageBook(page.config, 'manual')
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
          const routePath = `${book}${pagePath}/${subpage}`

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

          const dir = resolve(distDir, routePath)
          mkdirSync(dir, { recursive: true })
          writeFileSync(resolve(dir, 'index.html'), html)
          count++
        }
      }

      console.log(`\x1b[36m[docsector]\x1b[0m Pre-rendered meta tags for ${count} routes`)
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

async function resolveHomePageSources (projectRoot, config = {}, options = {}) {
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

function createHomePageOverridePlugin (projectRoot) {
  const virtualId = 'virtual:docsector-homepage-override'
  const resolvedId = '\0' + virtualId
  let byLang = null
  let loadPromise = null

  const ensureSources = async () => {
    if (byLang) return byLang
    if (!loadPromise) {
      loadPromise = (async () => {
        const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href
        const { default: config } = await import(configUrl)
        const sources = await resolveHomePageSources(projectRoot, config, { logPrefix: '[docsector]' })
        byLang = sources.byLang
        return byLang
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
        await ensureSources()
        return `export default ${JSON.stringify(byLang || {})}`
      }

      await ensureSources()
      if (!byLang) return null

      const match = id.match(/Homepage\.([A-Za-z0-9-]+)\.md\?raw(?:$|&)/)
      if (!match) return null

      const lang = match[1]
      const content = byLang[lang]
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

  // LLM bot user-agent patterns
  const LLM_BOT_PATTERN = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|Google-Extended|Gemini-Deep-Research|PerplexityBot|Perplexity-User|Bytespider|CCBot|Meta-ExternalAgent|FacebookBot|Amazonbot|Applebot-Extended|cohere-ai|DuckAssistBot|GrokBot|AI2Bot|YouBot|PetalBot/i

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

      server.middlewares.use(async (req, res, next) => {
        await configReady

        const url = new URL(req.url, 'http://localhost')
        const accept = (req.headers.accept || '').toLowerCase()
        const wantsMarkdown = accept.includes('text/markdown')
        const lang = url.searchParams.get('lang') || defaultLang

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
          if ((markdownNegotiationEnabled && wantsMarkdown) || (markdownAgentFallback && LLM_BOT_PATTERN.test(req.headers['user-agent'] || ''))) {
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
        if (markdownAgentFallback && LLM_BOT_PATTERN.test(ua)) {
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
      const { allPages: pages } = await loadBooksRegistry(projectRoot)

      const defaultLang = config.defaultLanguage || config.languages?.[0]?.value || 'en-US'
      let count = 0

      for (const [pagePath, page] of Object.entries(pages)) {
        if (page.config === null) continue
        if (page.config.status === 'empty') continue

        const book = resolvePageBook(page.config, 'manual')

        const subpages = ['overview']
        if (page.config.subpages?.showcase) subpages.push('showcase')
        if (page.config.subpages?.vs) subpages.push('vs')

        for (const subpage of subpages) {
          const srcFile = resolve(pagesDir, `${book}${pagePath}.${subpage}.${defaultLang}.md`)
          if (!existsSync(srcFile)) continue

          const routePath = `${book}${pagePath}/${subpage}`
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

      // Generate sitemap.xml if siteUrl is configured
      const siteUrl = (config.siteUrl || '').replace(/\/+$/, '')
      if (siteUrl) {
        const today = new Date().toISOString().split('T')[0]
        let urls = ''

        for (const [pagePath, page] of Object.entries(pages)) {
          if (page.config === null) continue
          if (page.config.status === 'empty') continue

          const book = resolvePageBook(page.config, 'manual')

          const subpages = ['overview']
          if (page.config.subpages?.showcase) subpages.push('showcase')
          if (page.config.subpages?.vs) subpages.push('vs')

          for (const subpage of subpages) {
            const srcFile = resolve(pagesDir, `${book}${pagePath}.${subpage}.${defaultLang}.md`)
            if (!existsSync(srcFile)) continue

            const routePath = `/${book}${pagePath}/${subpage}`
            urls += `  <url>\n    <loc>${siteUrl}${routePath}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`
          }
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`
        writeFileSync(resolve(distDir, 'sitemap.xml'), sitemap)
        console.log(`\x1b[36m[docsector]\x1b[0m Generated sitemap.xml`)

        // Generate llms.txt and llms-full.txt (LLM-friendly page index and full content)
        const brandingName = config.branding?.name || 'Documentation'
        const brandingVersion = config.branding?.version || ''
        const brandingDesc = config.branding?.description || `${brandingName} documentation`

        let llmsIndex = `# ${brandingName}${brandingVersion ? ' ' + brandingVersion : ''}\n\n> ${brandingDesc}\n\n`
        let llmsFull = `# ${brandingName}${brandingVersion ? ' ' + brandingVersion : ''}\n\n> ${brandingDesc}\n\n---\n\n`

        const llmsSections = {}

        for (const [pagePath, page] of Object.entries(pages)) {
          if (page.config === null) continue
          if (page.config.status === 'empty') continue

          const book = resolvePageBook(page.config, 'manual')
          const title = page.data?.['*']?.title
            || page.data?.[defaultLang]?.title
            || page.data?.['en-US']?.title
            || pagePath.split('/').pop()
            || pagePath

          const subpages = ['overview']
          if (page.config.subpages?.showcase) subpages.push('showcase')
          if (page.config.subpages?.vs) subpages.push('vs')

          for (const subpage of subpages) {
            const srcFile = resolve(pagesDir, `${book}${pagePath}.${subpage}.${defaultLang}.md`)
            if (!existsSync(srcFile)) continue

            const routePath = `${book}${pagePath}/${subpage}`
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

      if (markdownNegotiationEnabled || webBotAuthEnabled) {
        const functionsDir = resolve(projectRoot, 'functions')
        mkdirSync(functionsDir, { recursive: true })

        const middlewareCode = `const LLM_BOT_PATTERN = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|Google-Extended|Gemini-Deep-Research|PerplexityBot|Perplexity-User|Bytespider|CCBot|Meta-ExternalAgent|FacebookBot|Amazonbot|Applebot-Extended|cohere-ai|DuckAssistBot|GrokBot|AI2Bot|YouBot|PetalBot/i

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
        for (const [pagePath, page] of Object.entries(pages)) {
          if (page.config === null) continue
          if (page.config.status === 'empty') continue

          const book = resolvePageBook(page.config, 'manual')
          const defaultTitle = page.data?.['*']?.title
            || page.data?.[defaultLang]?.title
            || page.data?.['en-US']?.title
            || pagePath.split('/').pop()
            || pagePath

          const subpageList = ['overview']
          if (page.config.subpages?.showcase) subpageList.push('showcase')
          if (page.config.subpages?.vs) subpageList.push('vs')

          for (const subpage of subpageList) {
            const srcFile = resolve(pagesDir, `${book}${pagePath}.${subpage}.${defaultLang}.md`)
            if (!existsSync(srcFile)) continue

            mcpPages.push({
              path: `${book}${pagePath}/${subpage}`,
              title: defaultTitle,
              book,
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
          let serverCode = readFileSync(templatePath, 'utf-8')
          serverCode = serverCode
            .replaceAll('__MCP_SERVER_NAME__', mcpServerName)
            .replaceAll('__MCP_SERVER_VERSION__', mcpVersion)
            .replaceAll('__MCP_TOOL_SUFFIX__', mcpToolSuffix)
            .replaceAll('__MCP_SITE_URL__', siteUrl || '')

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
      if (config.mcp || markdownNegotiationEnabled || webBotAuthEnabled) {
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

  return {
    // Boot files — Quasar resolves these via 'boot/<name>' imports.
    // Since the 'boot' alias points to packageRoot/src/boot/ in consumer mode,
    // consumer-specific boot files are resolved via per-file Vite aliases
    // added in extendViteConf below.
    boot: [
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

    extras: [
      'fontawesome-v5',
      'roboto-font',
      'material-icons'
    ],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },

      vueRouterMode: 'history',

      vitePlugins: [
        createBooksPlugin(projectRoot),
        createHjsonPlugin(),
        createHomePageOverridePlugin(projectRoot),
        createGitDatesPlugin(projectRoot),
        createMarkdownEndpointPlugin(projectRoot),
        createMarkdownBuildPlugin(projectRoot),
        createPrerenderMetaPlugin(projectRoot),
        ...vitePlugins
      ],

      extendViteConf (viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = viteConf.resolve.alias || {}

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
          'hjson', 'q-colorize-mixin', 'mermaid'
        ]

        // Exclude boot files and the router from pre-bundling.
        // Boot files (especially boot/i18n) import the consumer's src/i18n/index.js
        // which uses import.meta.glob — a compile-time Vite directive that only
        // works in source files. If pre-bundled, the glob calls become dead code
        // and no i18n messages are loaded.
        // The router is excluded because routes.js imports consumer content via
        // the `pages` alias. If pre-bundled, consumer content gets embedded in
        // the optimizer cache whose hash doesn't track source file changes,
        // causing stale routes after editing page registry files.
        viteConf.optimizeDeps.exclude = [
          ...(viteConf.optimizeDeps.exclude || []),
          'boot/i18n', 'boot/store', 'boot/QZoom', 'boot/axios'
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

        // Tags for menu search — consumer's tags if available, else package's
        const consumerTags = resolve(projectRoot, 'src/i18n/tags.hjson')
        const packageTags = resolve(packageRoot, 'src/i18n/tags.hjson')
        viteConf.resolve.alias['@docsector/tags'] = existsSync(consumerTags) ? consumerTags : packageTags

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
      config: {},
      lang: 'en-US',
      plugins: [
        'Meta', 'LocalStorage', 'SessionStorage'
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
