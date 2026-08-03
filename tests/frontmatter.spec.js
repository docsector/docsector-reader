import { describe, expect, it } from 'vitest'

import {
  applyFrontmatterOverlayToRoutes,
  extractFrontmatterBlock,
  mergePageFrontmatter,
  mergeTagTerms,
  parseFrontmatter,
  resolveSubpageMeta,
  stripFrontmatter
} from '../src/frontmatter.js'

const FM = '---\ntitle: Ajax Bar\ndesc: Loading bar component.\nkeys: QAjaxBar loading\n---\n\n## Overview\n\nBody.\n'

describe('frontmatter detection', () => {
  it('detects a block only when the first line is ---', () => {
    expect(extractFrontmatterBlock(FM)).not.toBeNull()
    expect(extractFrontmatterBlock('## Overview\n\n---\ntitle: X\n---\n')).toBeNull()
    expect(extractFrontmatterBlock('')).toBeNull()
    expect(extractFrontmatterBlock('\n---\ntitle: X\n---\n')).toBeNull()
  })

  it('treats an unclosed block as plain content', () => {
    const source = '---\ntitle: X\n\n## Heading\n'
    expect(extractFrontmatterBlock(source)).toBeNull()
    expect(stripFrontmatter(source)).toBe(source)
    expect(parseFrontmatter(source).data).toBeNull()
  })

  it('accepts BOM, CRLF and the ... close marker', () => {
    const bom = '﻿---\ntitle: X\n---\nBody.'
    expect(parseFrontmatter(bom).data).toEqual({ title: 'X' })

    const crlf = '---\r\ntitle: X\r\n---\r\nBody.'
    expect(parseFrontmatter(crlf).data).toEqual({ title: 'X' })

    const dots = '---\ntitle: X\n...\nBody.'
    expect(parseFrontmatter(dots).data).toEqual({ title: 'X' })
  })

  it('leaves a mid-document --- untouched', () => {
    const source = '# Title\n\nBefore.\n\n---\n\nAfter.\n'
    expect(stripFrontmatter(source)).toBe(source)
  })

  it('parses an empty block to an empty data object', () => {
    const parsed = parseFrontmatter('---\n---\nBody.')
    expect(parsed.data).toEqual({})
    expect(parsed.content).toBe('Body.')
  })
})

describe('frontmatter stripping', () => {
  it('strips the block and keeps the content', () => {
    expect(stripFrontmatter(FM)).toBe('\n## Overview\n\nBody.\n')
  })

  it('is idempotent', () => {
    expect(stripFrontmatter(stripFrontmatter(FM))).toBe(stripFrontmatter(FM))
  })
})

describe('frontmatter parsing', () => {
  it('parses scalars: quoted strings, booleans, null, numbers', () => {
    const { data } = parseFrontmatter([
      '---',
      "single: 'quoted value'",
      'double: "another"',
      'yes: true',
      'no: false',
      'nothing: null',
      'tilde: ~',
      'int: 42',
      'float: -1.5',
      'plain: The QAjaxBar Vue component',
      '---',
      ''
    ].join('\n'))

    expect(data).toEqual({
      single: 'quoted value',
      double: 'another',
      yes: true,
      no: false,
      nothing: null,
      tilde: null,
      int: 42,
      float: -1.5,
      plain: 'The QAjaxBar Vue component'
    })
  })

  it('parses one-level lists (the Quasar related: form)', () => {
    const { data } = parseFrontmatter([
      '---',
      'related:',
      '  - /quasar-plugins/loading',
      '  - /quasar-plugins/loading-bar',
      '---',
      ''
    ].join('\n'))

    expect(data.related).toEqual(['/quasar-plugins/loading', '/quasar-plugins/loading-bar'])
  })

  it('skips comments and blank lines', () => {
    const { data } = parseFrontmatter('---\n# a comment\n\ntitle: X\n---\n')
    expect(data).toEqual({ title: 'X' })
  })

  it('warns and drops unsupported syntax without failing', () => {
    const warnings = []
    const { data } = parseFrontmatter([
      '---',
      'title: Kept',
      'menu:',
      '  header: nested-map',
      'weird line without a key',
      '---',
      ''
    ].join('\n'), { onWarning: message => warnings.push(message) })

    expect(data).toEqual({ title: 'Kept' })
    expect(data.menu).toBeUndefined()
    expect(warnings.length).toBeGreaterThanOrEqual(2)
  })
})

describe('mergeTagTerms', () => {
  it('appends and dedupes across space/comma separators', () => {
    expect(mergeTagTerms('install setup', 'setup, QAjaxBar loading')).toBe('install setup QAjaxBar loading')
    expect(mergeTagTerms('', 'a b')).toBe('a b')
    expect(mergeTagTerms('a b', '')).toBe('a b')
    expect(mergeTagTerms(undefined, undefined)).toBe('')
  })
})

describe('resolveSubpageMeta', () => {
  const subpageMeta = {
    showcase: {
      'pt-BR': { title: 'Demonstração' },
      'en-US': { title: 'Showcase', description: 'Live demo.' }
    }
  }

  it('resolves locale, then *, then en-US, then first', () => {
    expect(resolveSubpageMeta(subpageMeta, 'showcase', 'pt-BR')).toEqual({ title: 'Demonstração' })
    expect(resolveSubpageMeta(subpageMeta, 'showcase', 'es-ES')).toEqual({ title: 'Showcase', description: 'Live demo.' })
    expect(resolveSubpageMeta(subpageMeta, 'vs', 'en-US')).toBeNull()
    expect(resolveSubpageMeta(null, 'showcase', 'en-US')).toBeNull()
  })
})

describe('mergePageFrontmatter', () => {
  const page = () => ({
    config: {
      icon: 'flag',
      status: 'done',
      meta: { description: { 'en-US': 'Registry description', 'pt-BR': 'Descrição do registry' } },
      book: 'guide',
      menu: {},
      subpages: { showcase: true }
    },
    data: {
      'en-US': { title: 'Registry Title' },
      'pt-BR': { title: 'Título do registry' }
    },
    metadata: {
      tags: { 'en-US': 'install setup' }
    }
  })

  it('overrides title and desc per locale from the overview file', () => {
    const merged = mergePageFrontmatter(page(), {
      overview: { 'en-US': { title: 'Page Title', desc: 'Page description.' } }
    })

    expect(merged.data['en-US'].title).toBe('Page Title')
    expect(merged.data['pt-BR'].title).toBe('Título do registry')
    expect(merged.config.meta.description['en-US']).toBe('Page description.')
    expect(merged.config.meta.description['pt-BR']).toBe('Descrição do registry')
  })

  it('lifts a plain-string registry description before merging', () => {
    const source = page()
    source.config.meta = { description: 'One string for all locales' }

    const merged = mergePageFrontmatter(source, {
      overview: { 'pt-BR': { desc: 'Descrição da página.' } }
    })

    expect(merged.config.meta.description).toEqual({
      '*': 'One string for all locales',
      'pt-BR': 'Descrição da página.'
    })
  })

  it('appends keys to the registry tags instead of replacing them', () => {
    const merged = mergePageFrontmatter(page(), {
      overview: { 'en-US': { keys: 'QAjaxBar install' } }
    })

    expect(merged.metadata.tags['en-US']).toBe('install setup QAjaxBar')
  })

  it('accepts keys as a list', () => {
    const merged = mergePageFrontmatter(page(), {
      overview: { 'pt-BR': { keys: ['carregando', 'barra'] } }
    })

    expect(merged.metadata.tags['pt-BR']).toBe('carregando barra')
  })

  it('merges page-level keys from the overview file, in-page winning', () => {
    const merged = mergePageFrontmatter(page(), {
      overview: { 'en-US': { icon: 'bolt', status: 'new', examples: 'QAjaxBar', related: ['/guide/loading'] } }
    })

    expect(merged.config.icon).toBe('bolt')
    expect(merged.config.status).toBe('new')
    expect(merged.config.examples).toBe('QAjaxBar')
    expect(merged.config.related).toEqual(['/guide/loading'])
  })

  it('prefers the default-language file for page-level keys and warns on conflict', () => {
    const warnings = []
    const merged = mergePageFrontmatter(page(), {
      overview: {
        'pt-BR': { icon: 'star' },
        'en-US': { icon: 'bolt' }
      }
    }, { defaultLang: 'en-US', onWarning: message => warnings.push(message) })

    expect(merged.config.icon).toBe('bolt')
    expect(warnings.some(message => message.includes('"icon"'))).toBe(true)
  })

  it('never honors book/type from frontmatter', () => {
    const warnings = []
    const merged = mergePageFrontmatter(page(), {
      overview: { 'en-US': { book: 'manual' } }
    }, { onWarning: message => warnings.push(message) })

    expect(merged.config.book).toBe('guide')
    expect(warnings.some(message => message.includes('"book"'))).toBe(true)
  })

  it('routes showcase title/desc into subpageMeta and appends its keys', () => {
    const merged = mergePageFrontmatter(page(), {
      showcase: { 'en-US': { title: 'Live Demo', desc: 'See it running.', keys: 'demo' } }
    })

    expect(merged.subpageMeta.showcase['en-US']).toEqual({ title: 'Live Demo', description: 'See it running.' })
    expect(merged.metadata.tags['en-US']).toBe('install setup demo')
    expect(merged.data['en-US'].title).toBe('Registry Title')
  })

  it('deep-merges subpageMeta — a pt-BR patch never wipes a registry en-US slot', () => {
    const source = page()
    source.subpageMeta = {
      showcase: { 'en-US': { title: 'Registry Showcase', description: 'Registry demo desc.' } }
    }

    const merged = mergePageFrontmatter(source, {
      showcase: { 'pt-BR': { title: 'Demonstração' } }
    })

    expect(merged.subpageMeta.showcase['en-US']).toEqual({ title: 'Registry Showcase', description: 'Registry demo desc.' })
    expect(merged.subpageMeta.showcase['pt-BR']).toEqual({ title: 'Demonstração' })

    // : same-locale patches keep sibling fields too
    const sameLocale = mergePageFrontmatter(source, {
      showcase: { 'en-US': { title: 'From FM' } }
    })
    expect(sameLocale.subpageMeta.showcase['en-US']).toEqual({ title: 'From FM', description: 'Registry demo desc.' })
  })

  it('warns and ignores page-level keys in showcase files', () => {
    const warnings = []
    const merged = mergePageFrontmatter(page(), {
      showcase: { 'en-US': { icon: 'bolt' } }
    }, { onWarning: message => warnings.push(message) })

    expect(merged.config.icon).toBe('flag')
    expect(warnings.some(message => message.includes('showcase'))).toBe(true)
  })

  it('never mutates the input page and returns the same reference when nothing applies', () => {
    const source = page()
    const snapshot = JSON.parse(JSON.stringify(source))

    const merged = mergePageFrontmatter(source, {
      overview: { 'en-US': { title: 'Changed' } }
    })

    expect(source).toEqual(snapshot)
    expect(merged).not.toBe(source)

    expect(mergePageFrontmatter(source, {})).toBe(source)
    expect(mergePageFrontmatter(source, null)).toBe(source)
  })

  it('ignores frontmatter on category entries (config: null)', () => {
    const warnings = []
    const category = { config: null, data: { 'en-US': { title: 'Category' } } }

    const merged = mergePageFrontmatter(category, {
      overview: { 'en-US': { title: 'X' } }
    }, { onWarning: message => warnings.push(message) })

    expect(merged).toBe(category)
    expect(warnings).toHaveLength(1)
  })
})

describe('applyFrontmatterOverlayToRoutes', () => {
  const routes = () => ({
    '/getting-started': {
      config: { icon: 'flag', status: 'done', book: 'guide', menu: {}, subpages: {} },
      data: { 'en-US': { title: 'Getting Started' } }
    },
    '/untouched': {
      config: { icon: 'circle', status: 'done', book: 'guide', menu: {}, subpages: {} },
      data: { 'en-US': { title: 'Untouched' } }
    }
  })

  it('keys the overlay by /<book><pagePath> and preserves untouched references', () => {
    const source = routes()
    const applied = applyFrontmatterOverlayToRoutes(source, {
      '/guide/getting-started': { overview: { 'en-US': { title: 'From Frontmatter' } } }
    }, 'guide', 'en-US')

    expect(applied).not.toBe(source)
    expect(applied['/getting-started'].data['en-US'].title).toBe('From Frontmatter')
    expect(applied['/untouched']).toBe(source['/untouched'])
  })

  it('returns the same reference when the overlay is empty or misses every page', () => {
    const source = routes()
    expect(applyFrontmatterOverlayToRoutes(source, {}, 'guide', 'en-US')).toBe(source)
    expect(applyFrontmatterOverlayToRoutes(source, { '/other/page': { overview: {} } }, 'guide', 'en-US')).toBe(source)
  })
})
