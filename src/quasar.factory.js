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

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
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
        ...vitePlugins
      ],

      extendViteConf (viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = viteConf.resolve.alias || {}

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
        'LocalStorage', 'SessionStorage'
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
