import { describe, expect, it } from 'vitest'

import {
  applyFrontmatterOverlayToRoutes,
  compileFrontmatterPatch,
  extractFrontmatterBlock,
  fingerprintFrontmatter,
  mergePageFrontmatter,
  mergeTagTerms,
  normalizePageFaq,
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

describe('frontmatter lists of maps and block scalars', () => {
  const parse = (lines, options) => parseFrontmatter(['---', ...lines, '---', 'Body.'].join('\n'), options)

  it('parses a list of maps — the faq form', () => {
    const { data } = parse([
      'faq:',
      '  - q: What is Docsector?',
      '    a: A documentation engine.',
      '  - q: "Is it free: really?"',
      '    a: Yes, MIT.'
    ])

    expect(data.faq).toEqual([
      { q: 'What is Docsector?', a: 'A documentation engine.' },
      { q: 'Is it free: really?', a: 'Yes, MIT.' }
    ])
  })

  it('keeps colons inside unquoted values and tells maps from scalars the YAML way', () => {
    const { data } = parse([
      'faq:',
      '  - q: What is X: a thing?',
      '    a: See http://example.com',
      'related:',
      '  - http://example.com/a',
      '  - /plain/path'
    ])

    expect(data.faq).toEqual([{ q: 'What is X: a thing?', a: 'See http://example.com' }])
    expect(data.related).toEqual(['http://example.com/a', '/plain/path'])
  })

  it('reads literal block scalars with dedent, blank lines and comment-like lines', () => {
    const { data } = parse([
      'faq:',
      '  - q: How do I publish?',
      '    a: |',
      '      Run the build:',
      '',
      '      ```bash',
      '      # not a comment here',
      '      docsector build',
      '      ```',
      '  - q: Next?',
      '    a: Done.'
    ])

    expect(data.faq[0].a).toBe('Run the build:\n\n```bash\n# not a comment here\ndocsector build\n```\n')
    expect(data.faq[1]).toEqual({ q: 'Next?', a: 'Done.' })
  })

  it('honors the strip (-) and keep (+) chomping indicators', () => {
    const { data } = parse([
      'strip: |-',
      '  one',
      '  two',
      '',
      'keep: |+',
      '  three',
      '',
      '',
      'clip: |',
      '  four',
      ''
    ])

    expect(data.strip).toBe('one\ntwo')
    expect(data.keep).toBe('three\n\n\n')
    expect(data.clip).toBe('four\n')
  })

  it('folds > blocks into paragraphs', () => {
    const { data } = parse([
      'desc: >',
      '  A long description',
      '  that wraps.',
      '',
      '  Second paragraph.'
    ])

    expect(data.desc).toBe('A long description that wraps.\nSecond paragraph.\n')
  })

  it('keeps more-indented lines of a block and stops at the next key', () => {
    const { data } = parse([
      'faq:',
      '  - q: Code?',
      '    a: |',
      '      Indented:',
      '',
      '          four spaces',
      'title: After'
    ])

    expect(data.faq[0].a).toBe('Indented:\n\n    four spaces\n')
    expect(data.title).toBe('After')
  })

  it('allows blank lines and comments between list items', () => {
    const { data } = parse([
      'faq:',
      '  - q: One',
      '    a: 1',
      '',
      '  # second one below',
      '  - q: Two',
      '    a: 2'
    ])

    expect(data.faq).toEqual([{ q: 'One', a: 1 }, { q: 'Two', a: 2 }])
  })

  it('still rejects a nested map directly under a key', () => {
    const warnings = []
    const { data } = parse(['menu:', '  header: nested'], { onWarning: message => warnings.push(message) })

    expect(data.menu).toBeUndefined()
    expect(warnings.some(message => message.includes('header: nested'))).toBe(true)
  })

  it('warns about a line inside a map item that is not an entry', () => {
    const warnings = []
    const { data } = parse(['faq:', '  - q: One', '    just text', '    a: 1'], { onWarning: message => warnings.push(message) })

    expect(data.faq[0].q).toBe('One')
    expect(warnings.some(message => message.includes('just text'))).toBe(true)
  })

  it('reports each top-level key span, ignoring trailing blank lines', () => {
    const { spans } = parse([
      'title: X',
      'faq:',
      '  - q: One',
      '    a: |',
      '      Line',
      '',
      'keys: a b'
    ])

    expect(spans).toEqual({ title: [0, 0], faq: [1, 4], keys: [6, 6] })
  })

  it('returns empty spans when there is no block', () => {
    expect(parseFrontmatter('## Title\n').spans).toEqual({})
  })
})

describe('frontmatter multi-line plain scalars', () => {
  const parse = (lines, options) => parseFrontmatter(['---', ...lines, '---', 'Body.'].join('\n'), options)

  it('continues a value on deeper-indented lines, as YAML folds them', () => {
    const warnings = []
    const { data, spans } = parse([
      'title: Getting started',
      'faq:',
      '  - q: Is it free?',
      '    a: Yes, it is MIT licensed, and you can use it',
      '      in commercial projects.',
      '  - q: A question written',
      '      over two lines?',
      '    a: Still one question.'
    ], { onWarning: message => warnings.push(message) })

    expect(data.faq).toEqual([
      { q: 'Is it free?', a: 'Yes, it is MIT licensed, and you can use it in commercial projects.' },
      { q: 'A question written over two lines?', a: 'Still one question.' }
    ])
    expect(spans.faq).toEqual([1, 7])
    expect(warnings).toEqual([])
  })

  it('keeps a blank line inside a continued value as a line break', () => {
    const { data } = parse(['desc: First line', '  second line', '', '  new paragraph'])

    expect(data.desc).toBe('First line second line\nnew paragraph')
  })

  it('continues quoted scalars and top-level values too', () => {
    const { data } = parse(['title: "A quoted title', '  that wraps"', 'keys: a b'])

    expect(data).toEqual({ title: 'A quoted title that wraps', keys: 'a b' })
  })

  it('takes the value of a bare entry from the lines below it', () => {
    const { data } = parse(['faq:', '  - q: One', '    a:', '      The answer.'])

    expect(data.faq).toEqual([{ q: 'One', a: 'The answer.' }])
  })

  it('ends a continued value at a comment line', () => {
    const { data } = parse(['faq:', '  - q: One', '    a: The answer', '    # a note', '    x: 1'])

    expect(data.faq).toEqual([{ q: 'One', a: 'The answer', x: 1 }])
  })

  it('reads the entries of an item across comment lines', () => {
    const { data } = parse(['faq:', '  - q: One', '    # the answer below', '    a: 1'])

    expect(data.faq).toEqual([{ q: 'One', a: 1 }])
  })

  it('covers warned lines in the key span', () => {
    const warnings = []
    const { spans } = parse(['faq:', '  - q: One', '    a: 1', '   misaligned: 2', 'title: X'], { onWarning: message => warnings.push(message) })

    expect(spans.faq).toEqual([0, 3])
    expect(warnings.some(message => message.includes('misaligned'))).toBe(true)
  })

  it('warns about a duplicate key and records every occurrence', () => {
    const warnings = []
    const { data, ranges } = parse(['faq: first', 'title: X', 'faq: second'], { onWarning: message => warnings.push(message) })

    expect(data.faq).toBe('second')
    expect(ranges.filter(range => range.key === 'faq').map(range => [range.start, range.end])).toEqual([[0, 0], [2, 2]])
    expect(warnings).toContain('duplicate key "faq" — the last one wins')
  })
})

describe('fingerprintFrontmatter', () => {
  it('ignores content keys, so FAQ edits never restart the dev server', () => {
    const base = parseFrontmatter('---\ntitle: X\nfaq:\n  - q: One\n    a: 1\n---\n').data
    const edited = parseFrontmatter('---\ntitle: X\nfaq:\n  - q: One\n    a: 2\n---\n').data
    const retitled = parseFrontmatter('---\ntitle: Y\nfaq:\n  - q: One\n    a: 1\n---\n').data

    expect(fingerprintFrontmatter(edited)).toBe(fingerprintFrontmatter(base))
    expect(fingerprintFrontmatter(retitled)).not.toBe(fingerprintFrontmatter(base))
  })

  it('is null without a block and stable for an empty one', () => {
    expect(fingerprintFrontmatter(null)).toBeNull()
    expect(fingerprintFrontmatter(parseFrontmatter('---\n# only a comment\n---\n').data)).toBe('{}')
  })
})

describe('block scalars in registry text', () => {
  it('trims the line break a block scalar leaves in a title or description', () => {
    const { data } = parseFrontmatter('---\ntitle: |\n  Getting started\ndesc: >\n  A long\n  description.\n---\n')
    const patch = compileFrontmatterPatch({ overview: { 'en-US': data } })

    expect(patch.titleByLocale['en-US']).toBe('Getting started')
    expect(patch.descByLocale['en-US']).toBe('A long description.')
  })
})

describe('normalizePageFaq', () => {
  it('keeps text q/a pairs, trimmed, and coerces numbers', () => {
    expect(normalizePageFaq([
      { q: '  What?  ', a: 'This.\n' },
      { q: 42, a: 7 }
    ])).toEqual([
      { question: 'What?', answer: 'This.' },
      { question: '42', answer: '7' }
    ])
  })

  it('drops incomplete items with a warning', () => {
    const warnings = []
    const items = normalizePageFaq([
      { q: 'No answer' },
      { a: 'No question' },
      { q: '', a: 'Empty question' },
      'plain string',
      { q: true, a: 'Boolean question' },
      { q: 'Kept', a: 'Yes' }
    ], { onWarning: message => warnings.push(message) })

    expect(items).toEqual([{ question: 'Kept', answer: 'Yes' }])
    expect(warnings).toHaveLength(5)
    expect(warnings[0]).toContain('faq item 1')
  })

  it('ignores a missing key and warns about a non-list value', () => {
    const warnings = []

    expect(normalizePageFaq(undefined)).toEqual([])
    expect(normalizePageFaq(null)).toEqual([])
    expect(normalizePageFaq('What? This.', { onWarning: message => warnings.push(message) })).toEqual([])
    expect(warnings).toHaveLength(1)
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
