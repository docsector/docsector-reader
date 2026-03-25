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

import { readFileSync, existsSync, rmSync, mkdirSync, writeFileSync } from 'fs'
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
 * Create a Vite plugin that watches consumer content files (pages/index.js,
 * i18n languages, etc.) and forces the Vite dep optimizer to re-run when
 * they change.
 *
 * Why: The router module (`routes.js`) imports consumer content via the
 * `pages` alias. Vite's dep optimizer pre-bundles the router with the
 * consumer content inlined, but the optimizer cache hash is based on config
 * and lockfile only — NOT on consumer source files. So when pages/index.js
 * changes during development, the optimizer serves stale pre-bundled code
 * until the cache is manually cleared.
 *
 * Fix: When pages/index.js changes, the watcher plugin clears the dep cache,
 * sets an env flag, and restarts the server. On restart, the config reads the
 * flag and sets `optimizeDeps.force = true`, which makes Vite generate a new
 * browserHash — effectively busting the browser module cache.
 */
function createPagesWatchPlugin (projectRoot) {
  const pagesIndex = resolve(projectRoot, 'src', 'pages', 'index.js')
  return {
    name: 'docsector-pages-watch',
    configureServer (server) {
      server.watcher.on('change', (changedPath) => {
        if (changedPath === pagesIndex) {
          server.config.logger.info(
            '\\x1b[36m[docsector]\\x1b[0m pages/index.js changed — clearing dep cache and restarting...',
            { timestamp: true }
          )
          // Signal the restarted config to force a new optimizer hash
          process.env.__DOCSECTOR_FORCE_OPTIMIZE = '1'
          // Delete the stale optimizer cache
          const cacheDir = resolve(projectRoot, 'node_modules', '.q-cache')
          rmSync(cacheDir, { recursive: true, force: true })
          server.restart()
        }
      })
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

      // Dynamic import pages registry and docsector config
      const pagesUrl = pathToFileURL(resolve(projectRoot, 'src', 'pages', 'index.js')).href
      const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href

      const { default: pages } = await import(pagesUrl)
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

        const type = page.config.type ?? 'manual'
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
          const routePath = `${type}${pagePath}/${subpage}`

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
        createHjsonPlugin(),
        createPagesWatchPlugin(projectRoot),
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

        // Include a hash of pages/index.js in the optimizer config so that
        // Vite's configHash (and thus browserHash) changes whenever page
        // definitions change. This prevents the browser from serving stale
        // pre-bundled router modules from its module cache.
        const pagesFile = resolve(projectRoot, 'src', 'pages', 'index.js')
        if (existsSync(pagesFile)) {
          const pagesHash = createHash('sha256')
            .update(readFileSync(pagesFile))
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
        // causing stale routes after editing pages/index.js.
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
