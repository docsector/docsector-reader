/**
 * Docsector Reader — i18n Message Builder
 *
 * Extracts the markdown-to-i18n processing logic so consumer projects
 * can call it with their own import.meta.glob results.
 *
 * Usage in consumer's src/i18n/index.js (lazy page sources — preferred):
 *
 *   import { buildMessages } from '@docsector/docsector-reader/i18n'
 *   import boot from 'pages/boot'
 *   import { books } from 'virtual:docsector-books'
 *
 *   const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
 *   const mdModules = import.meta.glob('all markdown files under ../pages recursively', { query: '?raw', import: 'default' })
 *   const homepageModules = import.meta.glob('the Homepage markdown files under ../pages', { eager: true, query: '?raw', import: 'default' })
 *
 *   export default buildMessages({ langModules, mdModules, homepageModules, books, boot })
 *
 * Passing an EAGER mdModules glob still works (legacy mode): every page source
 * is inlined into the returned messages. With a non-eager glob, page sources
 * stay out of the boot bundle — buildMessages() registers the loaders in
 * ./sources.js and the router merges each page's markdown on navigation.
 */

import { registerSourceLoaders } from './sources'

/**
 * Engine default i18n keys, keyed by locale.
 * These are deep-merged into consumer messages so engine components
 * always have their required translations available.
 */
const engineDefaults = {
  'en-US': {
    page: {
      lastUpdated: 'Last updated',
      newVersion: 'New in',
      copyPage: 'Copy page',
      copyPageCaption: 'Copy page as Markdown for LLMs',
      copyInlineCode: 'Click to copy inline code',
      copied: 'Copied!',
      viewAsMarkdown: 'View as Markdown',
      viewAsMarkdownCaption: 'View this page as plain text',
      openInChatGPT: 'Open in ChatGPT',
      openInChatGPTCaption: 'Ask ChatGPT about this page',
      openInClaude: 'Open in Claude',
      openInClaudeCaption: 'Ask Claude about this page',
      mcpServer: 'MCP Server',
      mcpServerCaption: 'Connect AI assistants via MCP',
      connectVSCode: 'Connect to VSCode',
      connectVSCodeCaption: 'Use this MCP in VSCode',
      connectVSCodeInsiders: 'Connect to VSCode Insiders',
      connectVSCodeInsidersCaption: 'Use this MCP in VSCode Insiders',
      connectClaudeCode: 'Connect to Claude Code',
      connectClaudeCodeCaption: 'Use this MCP in Claude Code',
      connectCodex: 'Connect to Codex',
      connectCodexCaption: 'Use this MCP in Codex'
    },
    menu: {
      settings: 'Settings',
      status: {
        empty: {
          _: 'empty',
          tooltip: 'This page is empty!'
        },
        draft: {
          _: 'draft',
          tooltip: 'This page is under construction.'
        },
        new: {
          _: 'new',
          tooltip: 'This page is new.',
          tooltipVersion: 'New in {version}'
        }
      },
      version: {
        status: {
          released: 'released',
          draft: 'draft',
          deprecated: 'deprecated'
        }
      }
    },
    settings: {
      general: {
        _: 'General Settings',
        language: {
          _: 'Language'
        }
      },
      appearance: {
        _: 'Appearance',
        theme: {
          _: 'Theme',
          auto: 'Auto',
          light: 'Light',
          dark: 'Dark'
        }
      }
    },
    assistant: {
      title: 'Docsector Assistant',
      subtitle: "I'm here to help you with the docs.",
      open: 'Open assistant',
      close: 'Close assistant',
      clear: 'Clear conversation',
      placeholder: 'Ask, search, or explain...',
      send: 'Send',
      stop: 'Stop',
      // "Attach", never "exclude": turning this off only drops the verbatim
      // copy of the page — retrieval can still surface it from the index.
      pageContext: {
        label: 'Page context',
        on: 'This page is attached to your prompt. Click to detach.',
        off: 'Attach this page to your prompt.'
      },
      sources: 'Sources',
      sourcesCount: '{count} sources',
      copyMessage: 'Copy message',
      retryMessage: 'Reload message',
      retryHistoryTitle: 'Reload from this message?',
      retryHistoryMessage: 'Messages after this question will be removed from the conversation.',
      retryHistoryConfirm: 'Reload',
      retryHistoryCancel: 'Cancel',
      copied: 'Message copied',
      loadEarlier: 'Load earlier messages',
      thinking: 'Searching the docs…',
      resize: 'Resize assistant',
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening'
      }
    },
    system: {
      // {name} is the configured branding.name — locales control the word order
      brand: '{name} Documentation',
      update: {
        message: 'Updated content is available. Please refresh the page.',
        refresh: 'Refresh',
        dismiss: 'Dismiss'
      }
    }
  },
  'pt-BR': {
    page: {
      lastUpdated: 'Última atualização',
      newVersion: 'Novo em',
      copyPage: 'Copiar página',
      copyPageCaption: 'Copiar página como Markdown para LLMs',
      copyInlineCode: 'Clique para copiar o código inline',
      copied: 'Copiado!',
      viewAsMarkdown: 'Ver como Markdown',
      viewAsMarkdownCaption: 'Ver esta página como texto simples',
      openInChatGPT: 'Abrir no ChatGPT',
      openInChatGPTCaption: 'Pergunte ao ChatGPT sobre esta página',
      openInClaude: 'Abrir no Claude',
      openInClaudeCaption: 'Pergunte ao Claude sobre esta página',
      mcpServer: 'Servidor MCP',
      mcpServerCaption: 'Conecte assistentes de IA via MCP',
      connectVSCode: 'Conectar ao VSCode',
      connectVSCodeCaption: 'Use este MCP no VSCode',
      connectVSCodeInsiders: 'Conectar ao VSCode Insiders',
      connectVSCodeInsidersCaption: 'Use este MCP no VSCode Insiders',
      connectClaudeCode: 'Conectar ao Claude Code',
      connectClaudeCodeCaption: 'Use este MCP no Claude Code',
      connectCodex: 'Conectar ao Codex',
      connectCodexCaption: 'Use este MCP no Codex'
    },
    menu: {
      settings: 'Configurações',
      status: {
        empty: {
          _: 'vazia',
          tooltip: 'Esta página está vazia!'
        },
        draft: {
          _: 'rascunho',
          tooltip: 'Esta página está em construção.'
        },
        new: {
          _: 'novo',
          tooltip: 'Esta página é nova.',
          tooltipVersion: 'Novo na {version}'
        }
      },
      version: {
        status: {
          released: 'publicada',
          draft: 'rascunho',
          deprecated: 'obsoleta'
        }
      }
    },
    settings: {
      general: {
        _: 'Configurações gerais',
        language: {
          _: 'Idioma'
        }
      },
      appearance: {
        _: 'Aparência',
        theme: {
          _: 'Tema',
          auto: 'Automático',
          light: 'Claro',
          dark: 'Escuro'
        }
      }
    },
    assistant: {
      title: 'Assistente Docsector',
      subtitle: 'Estou aqui para ajudar com a documentação.',
      open: 'Abrir assistente',
      close: 'Fechar assistente',
      clear: 'Limpar conversa',
      placeholder: 'Pergunte, pesquise ou explique...',
      send: 'Enviar',
      stop: 'Parar',
      pageContext: {
        label: 'Contexto da página',
        on: 'Esta página está anexada ao seu prompt. Clique para desanexar.',
        off: 'Anexe esta página ao seu prompt.'
      },
      sources: 'Fontes',
      sourcesCount: '{count} fontes',
      copyMessage: 'Copiar mensagem',
      retryMessage: 'Reenviar mensagem',
      retryHistoryTitle: 'Reenviar desta mensagem?',
      retryHistoryMessage: 'As mensagens depois desta pergunta serão removidas da conversa.',
      retryHistoryConfirm: 'Reenviar',
      retryHistoryCancel: 'Cancelar',
      copied: 'Mensagem copiada',
      loadEarlier: 'Carregar mensagens anteriores',
      thinking: 'Consultando a documentação…',
      resize: 'Redimensionar assistente',
      greeting: {
        morning: 'Bom dia',
        afternoon: 'Boa tarde',
        evening: 'Boa noite'
      }
    },
    system: {
      // {name} is the configured branding.name — locales control the word order
      brand: 'Documentação {name}',
      update: {
        message: 'Há conteúdo atualizado disponível. Atualize a página.',
        refresh: 'Atualizar',
        dismiss: 'Dispensar'
      }
    }
  }
}

/**
 * Deep-merge source into target (target values take precedence).
 */
function deepMerge (target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      deepMerge(target[key], source[key])
    } else if (!(key in target)) {
      target[key] = source[key]
    }
  }
  return target
}

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
 * @param {Object} options.mdModules - Result of recursively globbing markdown files under ../pages as raw imports (eager = inlined sources; non-eager = lazy-loaded sources)
 * @param {Object} [options.homepageModules] - Eager raw glob of the Homepage markdown files (required for lazy mdModules; ignored when mdModules is eager)
 * @param {Object} [options.pages] - Legacy merged page registry from virtual:docsector-books (allPages)
 * @param {Object} [options.books] - Book registry from virtual:docsector-books (preferred, avoids path collisions)
 * @param {Array} [options.pageEntries] - Version-aware page entries from virtual:docsector-books
 * @param {Object} options.boot - Boot meta from pages/boot.js
 * @param {string[]} [options.langs] - Language codes to process (auto-detected from langModules if omitted)
 * @param {Object<string,string>} [options.homePageOverride] - Optional per-language Home markdown override
 * @returns {Object} Complete i18n messages object keyed by locale
 */
export function buildMessages ({ langModules, mdModules, homepageModules, pages, books, pageEntries, boot, langs, homePageOverride = {} }) {
  // Auto-detect languages from HJSON files if not provided
  if (!langs) {
    langs = Object.keys(langModules).map(key => {
      // key is like './languages/en-US.hjson' — extract 'en-US'
      const match = key.match(/\/([^/]+)\.hjson$/)
      return match ? match[1] : null
    }).filter(Boolean)
  }

  // ? Lazy mode: a non-eager glob maps each key to a loader function
  const lazySources = Object.values(mdModules || {}).some(value => typeof value === 'function')
  if (lazySources) {
    registerSourceLoaders({ loaders: mdModules, langs, filter })
  }

  const homepageMdModules = (homepageModules && Object.keys(homepageModules).length > 0)
    ? homepageModules
    : (lazySources ? {} : mdModules)

  const i18n = {}

  // ? Build-compiled page module ({ v, tokens, ... }) — passes through as-is:
  //   the vue-i18n escape filter only exists to survive t() compilation, which
  //   compiled token modules never go through
  const isCompiled = (value) => {
    return typeof value === 'object' && value !== null && typeof value.tokens === 'string'
  }

  function load (topPage, path, subpage, lang, sourceRoot = '') {
    const normalizedSourceRoot = String(sourceRoot || '').replace(/^\/+|\/+$/g, '')
    const key = `../pages/${normalizedSourceRoot ? normalizedSourceRoot + '/' : ''}${topPage}/${path}.${subpage}.${lang}.md`
    const content = mdModules[key]

    if (!content) {
      console.warn(`[i18n] Missing markdown: ${key}`)
      return ''
    }

    if (isCompiled(content)) {
      return content
    }

    const source = filter(typeof content === 'string' ? content : String(content))
    return source
  }

  function loadHomepage (lang) {
    const override = homePageOverride?.[lang] ?? homePageOverride?.['en-US']
    if (isCompiled(override)) {
      return override
    }
    if (typeof override === 'string' && override.length > 0) {
      return filter(override)
    }

    const key = `../pages/Homepage.${lang}.md`
    const fallbackKey = '../pages/Homepage.en-US.md'

    const content = homepageMdModules[key] ?? homepageMdModules[fallbackKey]
    if (!content) {
      console.warn(`[i18n] Missing homepage markdown: ${key}`)
      return ''
    }

    if (isCompiled(content)) {
      return content
    }

    const source = filter(typeof content === 'string' ? content : String(content))
    return source
  }

  function extractHeadingFromHomepage (lang) {
    const override = homePageOverride?.[lang] ?? homePageOverride?.['en-US']
    if (isCompiled(override)) {
      return override.heading || ''
    }
    if (typeof override === 'string' && override.length > 0) {
      const htmlHeadingMatch = override.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      if (htmlHeadingMatch) {
        const htmlHeading = htmlHeadingMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (htmlHeading) {
          return htmlHeading
        }
      }

      const overrideMatch = override.match(/^#\s+(.+)$/m)
      return overrideMatch ? overrideMatch[1].trim() : ''
    }

    const key = `../pages/Homepage.${lang}.md`
    const fallbackKey = '../pages/Homepage.en-US.md'

    const content = homepageMdModules[key] ?? homepageMdModules[fallbackKey]
    if (!content) {
      return ''
    }

    if (isCompiled(content)) {
      return content.heading || ''
    }

    const raw = typeof content === 'string' ? content : String(content)
    const match = raw.match(/^#\s+(.+)$/m)
    if (!match) {
      return ''
    }

    return match[1].trim()
  }

  const resolvedPageEntries = []

  if (Array.isArray(pageEntries) && pageEntries.length > 0) {
    for (const entry of pageEntries) {
      resolvedPageEntries.push({
        key: entry.pagePath,
        page: entry.page,
        fallbackBook: entry.book,
        sourceRoot: entry.sourceRoot || '',
        i18nSegments: entry.i18nSegments
      })
    }
  } else if (books && typeof books === 'object' && Object.keys(books).length > 0) {
    for (const [bookId, book] of Object.entries(books)) {
      const routes = book?.routes || {}
      const fallbackBook = book?.config?.id || bookId || 'manual'

      for (const [key, page] of Object.entries(routes)) {
        resolvedPageEntries.push({ key, page, fallbackBook })
      }
    }
  } else {
    for (const [key, page] of Object.entries(pages || {})) {
      resolvedPageEntries.push({ key, page, fallbackBook: null })
    }
  }

  // @ Iterate langs
  for (const lang of langs) {
    // Load HJSON language file
    const langKey = `./languages/${lang}.hjson`
    i18n[lang] = langModules[langKey]?.default || langModules[langKey] || {}

    // Merge engine defaults (consumer values take precedence)
    if (engineDefaults[lang]) {
      deepMerge(i18n[lang], engineDefaults[lang])
    }

    // @ Homepage markdown in root route
    if (i18n[lang]._ === undefined) {
      i18n[lang]._ = {}
    }
    if (i18n[lang]._.home === undefined) {
      i18n[lang]._.home = {}
    }

    const homepageHeading = extractHeadingFromHomepage(lang)
    i18n[lang]._.home._ = homepageHeading || i18n[lang]._.home._ || i18n[lang].menu?.home || 'Home'

    if (i18n[lang]._.home.overview === undefined) {
      i18n[lang]._.home.overview = {}
    }

    const homeMeta = boot?.meta?.[lang] || boot?.meta?.['en-US'] || {}
    i18n[lang]._.home.overview._translations = homeMeta?.overview?._translations
    i18n[lang]._.home.overview._sections = homeMeta?.overview?._sections
    i18n[lang]._.home.overview.source = loadHomepage(lang)

    // @ Iterate pages
    for (const entry of resolvedPageEntries) {
      const { key, page, fallbackBook, sourceRoot = '', i18nSegments: entryI18nSegments } = entry
      const path = key.startsWith('/') ? key.slice(1) : key

      const config = page.config
      const data = page.data
      const meta = page.meta || boot.meta

      const topPage = config?.book ?? config?.type ?? fallbackBook ?? 'manual'
      const i18nSegments = Array.isArray(entryI18nSegments) && entryI18nSegments.length > 0
        ? entryI18nSegments
        : [topPage, ...path.split('/').filter(Boolean)]

      // ---

      const _ = i18nSegments.reduce((accumulator, current, index) => {
        let node = accumulator[current]

        // Set object if not exists
        if (node === undefined) {
          accumulator[current] = {}
          node = accumulator[current]
        }

        // @ Set metadata
        // title
        if (index === i18nSegments.length - 1 && node._ === undefined) {
          node._ = data?.[lang]?.title || data?.['*']?.title || data?.['en-US']?.title || ''
        }

        if (config === null) {
          return node
        }

        if (index < i18nSegments.length - 1) {
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
      }, i18n[lang]._)

      // ---

      if (config === null || config.status === 'empty') {
        continue
      }

      const hasInternalLink = typeof config?.link?.to === 'string' && config.link.to.trim().length > 0
      if (hasInternalLink) {
        continue
      }

      // ? Lazy mode: sources stay as '' seeds — merged at navigation time (./sources.js)
      if (lazySources) {
        continue
      }

      // @ Subpages
      // Overview
      _.overview.source = load(topPage, path, 'overview', lang, sourceRoot)
      // showcase
      if (config.subpages?.showcase) {
        _.showcase.source = load(topPage, path, 'showcase', lang, sourceRoot)
      }
      // Vs
      if (config.subpages?.vs) {
        _.vs.source = load(topPage, path, 'vs', lang, sourceRoot)
      }
    }
  }

  return i18n
}

export default buildMessages
