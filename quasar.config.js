/* eslint-env node */

import { configure } from 'quasar/wrappers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import HJSON from 'hjson'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default configure((/* ctx */) => {
  return {
    boot: [
      'store',
      'QZoom',
      'i18n',
      'axios'
    ],

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
        // HJSON loader plugin
        {
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
      ],

      extendViteConf (viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = viteConf.resolve.alias || {}
        viteConf.resolve.alias['docsector.config.js'] = resolve(__dirname, 'docsector.config.js')
      }
    },

    devServer: {
      port: 8181,
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
        name: 'Docsector Documentation System',
        short_name: 'Docsector Docs',
        description: 'Streamline your documentation process with Docsector.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#655529',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }
  }
})
