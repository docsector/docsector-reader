/**
 * Docsector Reader — i18n Message Builder
 *
 * Extracts the markdown-to-i18n processing logic so consumer projects
 * can call it with their own import.meta.glob results.
 *
 * Usage in consumer's src/i18n/index.js:
 *
 *   import { buildMessages } from '@docsector/docsector-reader/i18n'
 *   import boot from 'pages/boot'
 *   import pages from 'pages'
 *
 *   const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
 *   const mdModules = import.meta.glob('../pages/⁣**​/⁣*.md', { eager: true, query: '?raw', import: 'default' })
 *
 *   export default buildMessages({ langModules, mdModules, pages, boot })
 */

/**
 * Escape characters that conflict with vue-i18n message syntax.
 *
 * @param {string} source - Raw markdown string
 * @returns {string} Escaped string safe for vue-i18n
 */
export function filter (source) {
  const regex1 = /{/gm
  const regex2 = /}/gm
  const regex3 = /([@|])+/gm

  source = source
    .replace(regex1, '&#123;')
    .replace(regex2, '&#125;')
    .replace(regex3, "{'$&'}")

  return source
}

/**
 * Build complete i18n messages from HJSON locale files and Markdown page content.
 *
 * @param {Object} options
 * @param {Object} options.langModules - Result of import.meta.glob('./languages/*.hjson', { eager: true })
 * @param {Object} options.mdModules - Result of import.meta.glob('../pages/**​/*.md', { eager: true, query: '?raw', import: 'default' })
 * @param {Object} options.pages - Page registry from pages/index.js
 * @param {Object} options.boot - Boot meta from pages/boot.js
 * @param {string[]} [options.langs] - Language codes to process (auto-detected from langModules if omitted)
 * @returns {Object} Complete i18n messages object keyed by locale
 */
export function buildMessages ({ langModules, mdModules, pages, boot, langs }) {
  // Auto-detect languages from HJSON files if not provided
  if (!langs) {
    langs = Object.keys(langModules).map(key => {
      // key is like './languages/en-US.hjson' — extract 'en-US'
      const match = key.match(/\/([^/]+)\.hjson$/)
      return match ? match[1] : null
    }).filter(Boolean)
  }

  const i18n = {}

  function load (topPage, path, subpage, lang) {
    const key = `../pages/${topPage}/${path}.${subpage}.${lang}.md`
    const content = mdModules[key]

    if (!content) {
      console.warn(`[i18n] Missing markdown: ${key}`)
      return ''
    }

    const source = filter(typeof content === 'string' ? content : String(content))
    return source
  }

  // @ Iterate langs
  for (const lang of langs) {
    // Load HJSON language file
    const langKey = `./languages/${lang}.hjson`
    i18n[lang] = langModules[langKey]?.default || langModules[langKey] || {}

    // @ Iterate pages
    for (const [key, page] of Object.entries(pages)) {
      const path = key.slice(1)

      const config = page.config
      const data = page.data
      const meta = page.meta || boot.meta

      const topPage = config?.type ?? 'manual'

      // ---

      const _ = path.split('/').reduce((accumulator, current) => {
        let node = accumulator[current]

        // Set object if not exists
        if (node === undefined) {
          accumulator[current] = {}
          node = accumulator[current]
        }

        // @ Set metadata
        // title
        if (node._ === undefined) {
          node._ = data[lang]?.title || data['*']?.title
        }

        if (config === null) {
          return node
        }

        // Set subpages sources if not exists
        if (node.overview === undefined) {
          node.overview = {
            _translations: meta[lang]?.overview?._translations,
            _sections: meta[lang]?.overview?._sections,
            source: ''
          }
        }
        if (config.subpages?.showcase && node.showcase === undefined) {
          node.showcase = {
            _translations: meta[lang]?.showcase?._translations,
            _sections: meta[lang]?.showcase?._sections,
            source: ''
          }
        }
        if (config.subpages?.vs && node.vs === undefined) {
          node.vs = {
            _translations: meta[lang]?.vs?._translations,
            _sections: meta[lang]?.vs?._sections,
            source: ''
          }
        }

        return node
      }, i18n[lang]._[topPage])

      // ---

      if (config === null || config.status === 'empty') {
        continue
      }

      // @ Subpages
      // Overview
      _.overview.source = load(topPage, path, 'overview', lang)
      // showcase
      if (config.subpages?.showcase === true) {
        _.showcase.source = load(topPage, path, 'showcase', lang)
      }
      // Vs
      if (config.subpages?.vs === true) {
        _.vs.source = load(topPage, path, 'vs', lang)
      }
    }
  }

  return i18n
}

export default buildMessages
