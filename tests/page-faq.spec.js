import { describe, expect, it } from 'vitest'

import { buildPageAnchorTree } from '../src/components/page-anchor-tree.js'
import { parseFrontmatter } from '../src/frontmatter.js'
import { readPageFaqText } from '../src/components/page-section-tokens.js'
import {
  FAQ_STATIC_JSON_LD_ATTRIBUTE,
  buildAgentMarkdown,
  buildFaqJsonLd,
  injectFaqJsonLd,
  omitFaqTokens,
  renderFaqMarkdown,
  resolveFaqHash
} from '../src/page-faq.js'

const parseFrontmatterData = (source) => parseFrontmatter(source).data

const FAQ_BLOCK = [
  'faq:',
  '  - q: What is it?',
  '    a: A **documentation** engine.',
  '  - q: How do I publish?',
  '    a: |',
  '      Run `docsector build`.',
  '',
  '      Then deploy.'
]

describe('buildFaqJsonLd', () => {
  it('describes the FAQ as a schema.org FAQPage', () => {
    const jsonLd = buildFaqJsonLd([
      { question: 'What is it?', text: 'A documentation engine.' },
      { question: 'Free?', text: 'Yes.' }
    ])

    expect(JSON.parse(jsonLd)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is it?', acceptedAnswer: { '@type': 'Answer', text: 'A documentation engine.' } },
        { '@type': 'Question', name: 'Free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } }
      ]
    })
  })

  it('escapes < so the payload can never close its script element', () => {
    const jsonLd = buildFaqJsonLd([{ question: 'Break out?', text: '</script><script>alert(1)</script><!--' }])

    expect(jsonLd).not.toContain('<')
    expect(JSON.parse(jsonLd).mainEntity[0].acceptedAnswer.text).toBe('</script><script>alert(1)</script><!--')
  })

  it('returns nothing for a missing or empty FAQ', () => {
    expect(buildFaqJsonLd(undefined)).toBe('')
    expect(buildFaqJsonLd([])).toBe('')
    expect(buildFaqJsonLd([{ question: 'No text' }])).toBe('')
  })
})

describe('injectFaqJsonLd', () => {
  const HTML = '<html><head><title>X</title></head><body></body></html>'

  it('adds one marked script before </head>', () => {
    const html = injectFaqJsonLd(HTML, '{"a":1}')

    expect(html).toBe(`<html><head><title>X</title><script type="application/ld+json" ${FAQ_STATIC_JSON_LD_ATTRIBUTE}>{"a":1}</script></head><body></body></html>`)
  })

  it('leaves the page alone without a FAQ or a head', () => {
    expect(injectFaqJsonLd(HTML, '')).toBe(HTML)
    expect(injectFaqJsonLd('<body></body>', '{"a":1}')).toBe('<body></body>')
  })

  it('keeps $ sequences of the payload literal', () => {
    expect(injectFaqJsonLd(HTML, '{"a":"$&$1"}')).toContain('{"a":"$&$1"}')
  })
})

describe('readPageFaqText', () => {
  it('reads the FAQ as plain text for JSON-LD', () => {
    expect(readPageFaqText(['---', ...FAQ_BLOCK, '---', '', 'Body.'].join('\n'))).toEqual([
      { question: 'What is it?', text: 'A documentation engine.' },
      { question: 'How do I publish?', text: 'Run docsector build. Then deploy.' }
    ])
  })

  it('reads nothing from a page without a FAQ', () => {
    expect(readPageFaqText('## Plain\n')).toEqual([])
  })
})

describe('agent markdown', () => {
  it('renders the FAQ as a readable section', () => {
    expect(renderFaqMarkdown([{ question: 'Q1?', answer: 'A1.' }, { question: 'Q2?', answer: 'A2.' }]))
      .toBe('## FAQ\n\n### Q1?\n\nA1.\n\n### Q2?\n\nA2.\n')
  })

  it('moves the faq out of the frontmatter and to the end of the page', () => {
    const source = ['---', 'title: Page', ...FAQ_BLOCK, 'keys: a b', '---', '', '## Install', '', 'Body.', ''].join('\n')

    expect(buildAgentMarkdown(source)).toBe([
      '---',
      'title: Page',
      'keys: a b',
      '---',
      '',
      '## Install',
      '',
      'Body.',
      '',
      '## FAQ',
      '',
      '### What is it?',
      '',
      'A **documentation** engine.',
      '',
      '### How do I publish?',
      '',
      'Run `docsector build`.',
      '',
      'Then deploy.',
      ''
    ].join('\n'))
  })

  it('drops a block that only held the faq', () => {
    const source = ['---', ...FAQ_BLOCK, '---', '', '## Install', ''].join('\n')
    const output = buildAgentMarkdown(source)

    expect(output.startsWith('## Install\n')).toBe(true)
    expect(output).not.toContain('faq:')
    expect(output).toContain('## FAQ')
  })

  it('keeps a CRLF block and its ... close marker', () => {
    const source = ['---', 'title: Page', 'faq:', '  - q: Q?', '    a: A.', '...', 'Body.'].join('\r\n')
    const output = buildAgentMarkdown(source)

    expect(output.startsWith('---\ntitle: Page\n...\n')).toBe(true)
    expect(output).toContain('### Q?\n\nA.')
  })

  it('removes an invalid faq without appending an empty section', () => {
    const output = buildAgentMarkdown('---\ntitle: Page\nfaq:\n  - q: No answer\n---\n\nBody.\n')

    expect(output).toBe('---\ntitle: Page\n---\n\nBody.\n')
  })

  it('passes pages without a faq through untouched', () => {
    const withBlock = '---\ntitle: Page\n---\n\nBody.\n'

    expect(buildAgentMarkdown(withBlock)).toBe(withBlock)
    expect(buildAgentMarkdown('## Plain\n')).toBe('## Plain\n')
    expect(buildAgentMarkdown(undefined)).toBe('')
  })
})

describe('agent markdown edge cases', () => {
  it('never leaves an orphan line from a wrapped answer in the frontmatter', () => {
    const source = [
      '---',
      'title: Getting started',
      'faq:',
      '  - q: Is it free?',
      '    a: Yes, it is MIT licensed, and you can use it',
      '      in commercial projects.',
      '---',
      '',
      'Body.',
      ''
    ].join('\n')
    const output = buildAgentMarkdown(source)

    expect(output.startsWith('---\ntitle: Getting started\n---\n')).toBe(true)
    expect(output).toContain('### Is it free?\n\nYes, it is MIT licensed, and you can use it in commercial projects.')
    expect(parseFrontmatterData(output)).toEqual({ title: 'Getting started' })
  })

  it('removes every occurrence of a duplicated faq key', () => {
    const source = '---\nfaq:\n  - q: Old?\n    a: Old.\ntitle: Page\nfaq:\n  - q: New?\n    a: New.\n---\n\nBody.\n'
    const output = buildAgentMarkdown(source)

    expect(output).not.toContain('faq:')
    expect(output).not.toContain('Old?')
    expect(output).toContain('### New?')
    expect(output.startsWith('---\ntitle: Page\n---\n')).toBe(true)
  })

  it('writes a question spread over several lines as one heading', () => {
    expect(renderFaqMarkdown([{ question: 'A long\nquestion?', answer: 'A.' }])).toBe('## FAQ\n\n### A long question?\n\nA.\n')
  })
})

describe('resolveFaqHash', () => {
  const items = [{ anchorId: 'faq-is-it-free' }, { anchorId: 'faq-é-gratuito' }, { anchorId: 'faq-100%' }]

  it('matches decoded and percent-encoded hashes', () => {
    expect(resolveFaqHash('#faq-is-it-free', items)).toBe('faq-is-it-free')
    expect(resolveFaqHash('#faq-é-gratuito', items)).toBe('faq-é-gratuito')
    expect(resolveFaqHash('#faq-%C3%A9-gratuito', items)).toBe('faq-é-gratuito')
  })

  it('survives a hash that cannot be decoded again', () => {
    expect(() => resolveFaqHash('#faq-100%', items)).not.toThrow()
    expect(resolveFaqHash('#faq-100%', items)).toBe('faq-100%')
  })

  it('returns null for other hashes', () => {
    expect(resolveFaqHash('#install', items)).toBeNull()
    expect(resolveFaqHash('', items)).toBeNull()
    expect(resolveFaqHash('#faq-is-it-free', undefined)).toBeNull()
  })
})

describe('omitFaqTokens', () => {
  it('drops the closing FAQ token from a compiled tokens JSON', () => {
    const tokens = [{ tag: 'p', content: 'Body' }, { tag: 'faq', anchorId: 'faq', items: [{ question: 'Secret?', tokens: [{ tag: 'p', content: '{"tag":"faq"' }] }] }]

    expect(JSON.parse(omitFaqTokens(JSON.stringify(tokens)))).toEqual([{ tag: 'p', content: 'Body' }])
    expect(omitFaqTokens(JSON.stringify([tokens[1]]))).toBe('[]')
  })

  it('leaves tokens without a FAQ untouched', () => {
    const json = JSON.stringify([{ tag: 'p', content: 'Body' }])

    expect(omitFaqTokens(json)).toBe(json)
    expect(omitFaqTokens(undefined)).toBe('')
  })
})

describe('buildPageAnchorTree with a FAQ', () => {
  const tokens = [
    { tag: 'h2', anchorId: 'install', content: 'Install' },
    { tag: 'h3', anchorId: 'requirements', content: 'Requirements' },
    { tag: 'faq', anchorId: 'faq', items: [{ anchorId: 'faq-q' }] }
  ]

  it('adds the FAQ as one top-level entry labelled by the caller', () => {
    const { anchors, nodes } = buildPageAnchorTree(tokens, { faqLabel: 'Perguntas frequentes' })

    expect(anchors).toEqual(['install', 'requirements', 'faq'])
    expect(nodes[0].children.map(node => [node.id, node.label])).toEqual([
      ['install', 'Install'],
      ['faq', 'Perguntas frequentes']
    ])
    expect(nodes[0].children[1].children).toEqual([])
  })

  it('falls back to "FAQ" as the label', () => {
    expect(buildPageAnchorTree(tokens).nodes[0].children[1].label).toBe('FAQ')
  })
})
