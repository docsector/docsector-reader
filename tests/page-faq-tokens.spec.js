import { describe, expect, it } from 'vitest'

import { compilePageTokens } from '../src/components/page-tokens-compile.js'
import { tokenizePageSectionSource } from '../src/components/page-section-tokens.js'
import { parseCompiledPageTokens } from '../src/components/page-tokens-support.js'

const PAGE = [
  '---',
  'title: Getting started',
  'faq:',
  '  - q: What is `docsector`?',
  '    a: A documentation engine built on **Vue 3**.',
  '  - q: How do I publish?',
  '    a: |',
  '      Run the build:',
  '',
  '      ```bash',
  '      docsector build',
  '      ```',
  '',
  '      - then deploy `dist/spa`',
  '      - see [the guide](/guide/deploy)',
  '---',
  '',
  '## Install',
  '',
  'Body.',
  ''
].join('\n')

const tokenizePage = (source) => tokenizePageSectionSource(source, { codeToolbarDefault: null, stripFrontmatter: true })
const faqOf = (tokens) => tokens.filter(token => token.tag === 'faq')

describe('page FAQ token', () => {
  it('closes the page with one faq token after the content', () => {
    const tokens = tokenizePage(PAGE)

    expect(tokens.at(-1).tag).toBe('faq')
    expect(faqOf(tokens)).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ tag: 'h2', anchorId: 'install' })
  })

  it('carries anchors, plain and inline question text, plain answer text and answer tokens', () => {
    const [faq] = faqOf(tokenizePage(PAGE))
    const [first, second] = faq.items

    expect(faq.anchorId).toBe('faq')
    expect(first).toMatchObject({
      anchorId: 'faq-what-is-docsector',
      question: 'What is docsector?',
      text: 'A documentation engine built on Vue 3.'
    })
    expect(first.questionHTML).toBe('What is <code>docsector</code>?')
    expect(first.tokens).toEqual([expect.objectContaining({ tag: 'p' })])

    expect(second.anchorId).toBe('faq-how-do-i-publish')
    expect(second.text).toBe('Run the build: docsector build then deploy dist/spa see the guide')
    expect(second.tokens.map(token => token.tag)).toEqual(['p', 'code', 'ul'])
  })

  it('dedupes its anchors against the page headings', () => {
    const source = PAGE.replace('## Install', '## FAQ\n\n### What is docsector?')
    const tokens = tokenizePage(source)
    const [faq] = faqOf(tokens)

    expect(tokens[0].anchorId).toBe('faq')
    expect(faq.anchorId).toBe('faq-1')

    const anchors = [...tokens.map(token => token.anchorId).filter(Boolean), ...faq.items.map(item => item.anchorId)]
    expect(new Set(anchors).size).toBe(anchors.length)
  })

  it('drops incomplete items and emits nothing when none is left', () => {
    const partial = tokenizePage('---\nfaq:\n  - q: Only a question\n  - q: Full\n    a: Yes.\n---\n\nBody.\n')
    const empty = tokenizePage('---\nfaq:\n  - q: Only a question\n---\n\nBody.\n')

    expect(faqOf(partial)[0].items.map(item => item.question)).toEqual(['Full'])
    expect(faqOf(empty)).toEqual([])
  })

  it('emits nothing for pages without a faq key or without frontmatter', () => {
    expect(faqOf(tokenizePage('---\ntitle: X\n---\n\nBody.\n'))).toEqual([])
    expect(faqOf(tokenizePage('## Plain\n\nBody.\n'))).toEqual([])
  })

  it('never reads a block from sources that did not opt in (assistant answers)', () => {
    const tokens = tokenizePageSectionSource(PAGE, { codeToolbarDefault: null })

    expect(faqOf(tokens)).toEqual([])
  })

  it('never nests a faq inside a heading-less source', () => {
    const tokens = tokenizePageSectionSource(PAGE, { allowHeadingTokens: false, stripFrontmatter: true })

    expect(faqOf(tokens)).toEqual([])
  })
})

describe('page FAQ text fidelity', () => {
  it('keeps an escaped question as text, like the page body', () => {
    const [faq] = faqOf(tokenizePage('---\nfaq:\n  - q: Why is &lt;b&gt; shown?\n    a: Because &lt;b&gt; is escaped.\n---\n\nThe body: &lt;b&gt;\n'))

    expect(faq.items[0].questionHTML).toBe('Why is &lt;b&gt; shown?')
    expect(faq.items[0].questionHTML).not.toContain('<b>')
  })

  it('reads dev sources the way it reads build sources (vue-i18n brace escapes)', () => {
    const build = faqOf(tokenizePage('---\nfaq:\n  - q: What is `{x}`?\n    a: A `{y}` value.\n---\n\nBody.\n'))[0]
    const dev = faqOf(tokenizePage('---\nfaq:\n  - q: What is `&#123;x&#125;`?\n    a: A `&#123;y&#125;` value.\n---\n\nBody.\n'))[0]

    expect(dev.items[0].question).toBe('What is {x}?')
    expect(dev.items[0].anchorId).toBe(build.items[0].anchorId)
    expect(dev.items[0].questionHTML).toBe(build.items[0].questionHTML)
  })
})

describe('compiled page artifact', () => {
  it('bakes the faq token into the compiled tokens', async () => {
    const compiled = await compilePageTokens(PAGE)
    const tokens = parseCompiledPageTokens(compiled)

    expect(compiled.heading).toBe('')
    expect(tokens.at(-1).tag).toBe('faq')
    expect(tokens.at(-1).items).toHaveLength(2)
    expect(compiled.tokens).not.toContain('title: Getting started')
  })

  it('compiles pages without a faq exactly as before', async () => {
    const compiled = await compilePageTokens('---\ntitle: X\n---\n\n# Real\n\n## One\n')
    const tokens = parseCompiledPageTokens(compiled)

    expect(compiled.heading).toBe('Real')
    expect(faqOf(tokens)).toEqual([])
  })
})

describe('compiled math detection', () => {
  it('loads math for a formula that only appears in a FAQ answer', async () => {
    const compiled = await compilePageTokens('---\nfaq:\n  - q: The formula?\n    a: $$E = mc^2$$\n---\n\nNo math here.\n')

    expect(compiled.math).toBe(true)
  })

  it('ignores dollar signs in other metadata', async () => {
    const compiled = await compilePageTokens('---\ndesc: Costs $5 or $10 a month.\n---\n\nNo math here.\n')

    expect(compiled.math).toBe(false)
  })
})
