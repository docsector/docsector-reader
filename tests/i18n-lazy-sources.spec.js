import { afterEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import { buildMessages, filter } from '../src/i18n/helpers.js'
import {
  bindI18n,
  hasLazySources,
  loadRouteSources,
  registerSourceLoaders,
  resetSourceLoaders
} from '../src/i18n/sources.js'
import { ensureContentIndex, getContentIndex, resetContentIndexes } from '../src/search/content-index.js'

const langModules = {
  './languages/en-US.hjson': {
    menu: { home: 'Home' }
  },
  './languages/pt-BR.hjson': {
    menu: { home: 'Início' }
  }
}

const homepageModules = {
  '../pages/Homepage.en-US.md': '# Home\n\nBody',
  '../pages/Homepage.pt-BR.md': '# Início\n\nCorpo'
}

const books = {
  guide: {
    config: { id: 'guide' },
    routes: {
      '/http': {
        config: { book: 'guide', subpages: { showcase: true } },
        data: { 'en-US': { title: 'HTTP' }, 'pt-BR': { title: 'HTTP' } }
      }
    }
  }
}

const boot = {
  meta: {
    'en-US': {},
    'pt-BR': {}
  }
}

const lazyModules = (files) => {
  const modules = {}
  for (const [key, content] of Object.entries(files)) {
    modules[key] = vi.fn(() => Promise.resolve(content))
  }
  return modules
}

const routeMeta = {
  sourcePathBase: 'guide/http',
  i18nSegments: ['guide', 'http'],
  subpages: { showcase: true, vs: false }
}

afterEach(() => {
  resetSourceLoaders()
  resetContentIndexes()
  vi.restoreAllMocks()
})

describe('lazy page sources', () => {
  it('keeps page sources out of the messages and registers the loaders', () => {
    const mdModules = lazyModules({
      '../pages/guide/http.overview.en-US.md': '# HTTP'
    })

    const messages = buildMessages({ langModules, mdModules, homepageModules, books, boot, langs: ['en-US', 'pt-BR'] })

    expect(hasLazySources()).toBe(true)
    expect(messages['en-US']._.guide.http.overview.source).toBe('')
    expect(mdModules['../pages/guide/http.overview.en-US.md']).not.toHaveBeenCalled()
  })

  it('still resolves the homepage eagerly from homepageModules', () => {
    const messages = buildMessages({
      langModules,
      mdModules: lazyModules({ '../pages/guide/http.overview.en-US.md': '# HTTP' }),
      homepageModules,
      books,
      boot,
      langs: ['en-US', 'pt-BR']
    })

    expect(messages['en-US']._.home.overview.source).toContain('# Home')
    expect(messages['pt-BR']._.home.overview.source).toContain('# Início')
    expect(messages['en-US']._.home._).toBe('Home')
  })

  it('merges every locale of a route into the composer on load', async () => {
    const mdModules = lazyModules({
      '../pages/guide/http.overview.en-US.md': '# HTTP {curly}',
      '../pages/guide/http.overview.pt-BR.md': '# HTTP pt',
      '../pages/guide/http.showcase.en-US.md': '# Showcase'
    })

    const messages = buildMessages({ langModules, mdModules, homepageModules, books, boot, langs: ['en-US', 'pt-BR'] })
    const i18n = createI18n({ legacy: false, locale: 'en-US', messages, missingWarn: false, fallbackWarn: false })
    bindI18n(i18n.global)

    await loadRouteSources(routeMeta)

    expect(i18n.global.getLocaleMessage('en-US')._.guide.http.overview.source).toBe(filter('# HTTP {curly}'))
    expect(i18n.global.getLocaleMessage('pt-BR')._.guide.http.overview.source).toBe('# HTTP pt')
    expect(i18n.global.getLocaleMessage('en-US')._.guide.http.showcase.source).toBe('# Showcase')

    // Missing pt-BR showcase stays an empty seed
    expect(i18n.global.getLocaleMessage('pt-BR')._.guide.http.showcase.source).toBe('')

    // The active-locale render path resolves the merged source
    expect(i18n.global.tm('_.guide.http.overview.source')).toBe(filter('# HTTP {curly}'))
  })

  it('loads each markdown chunk only once across navigations', async () => {
    const mdModules = lazyModules({
      '../pages/guide/http.overview.en-US.md': '# HTTP'
    })

    const messages = buildMessages({ langModules, mdModules, homepageModules, books, boot, langs: ['en-US'] })
    const i18n = createI18n({ legacy: false, locale: 'en-US', messages, missingWarn: false, fallbackWarn: false })
    bindI18n(i18n.global)

    await loadRouteSources(routeMeta)
    await loadRouteSources(routeMeta)

    expect(mdModules['../pages/guide/http.overview.en-US.md']).toHaveBeenCalledTimes(1)
  })

  it('resolves without loaders, composer or page meta', async () => {
    await expect(loadRouteSources(routeMeta)).resolves.toBeUndefined()

    registerSourceLoaders({ loaders: {}, langs: ['en-US'], filter })
    await expect(loadRouteSources(null)).resolves.toBeUndefined()
    await expect(loadRouteSources({ sourcePathBase: '' })).resolves.toBeUndefined()
  })

  it('warns and resolves when a markdown chunk fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mdModules = {
      '../pages/guide/http.overview.en-US.md': vi.fn(() => Promise.reject(new Error('offline')))
    }

    const messages = buildMessages({ langModules, mdModules, homepageModules, books, boot, langs: ['en-US'] })
    const i18n = createI18n({ legacy: false, locale: 'en-US', messages, missingWarn: false, fallbackWarn: false })
    bindI18n(i18n.global)

    await expect(loadRouteSources(routeMeta)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load page source'),
      expect.any(Error)
    )
  })
})

describe('search content index', () => {
  it('fetches and caches the per-locale index', async () => {
    const fetcher = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ '/guide/http': '# http body' })
    }))

    const index = await ensureContentIndex('en-US', { base: '/', fetcher })

    expect(index['/guide/http']).toBe('# http body')
    expect(getContentIndex('en-US')).toBe(index)

    await ensureContentIndex('en-US', { base: '/', fetcher })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('/search-index.en-US.json')
  })

  it('resolves to null on fetch failure so search can fall back', async () => {
    const fetcher = vi.fn(() => Promise.reject(new Error('offline')))

    const index = await ensureContentIndex('pt-BR', { base: '/', fetcher })

    expect(index).toBeNull()
    expect(getContentIndex('pt-BR')).toBeNull()
  })
})
