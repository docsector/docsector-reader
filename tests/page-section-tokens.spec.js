import { describe, expect, it } from 'vitest'

import {
  parseCustomTagAttributes,
  tokenizePageSectionSource
} from '../src/components/page-section-tokens.js'

describe('page-section-tokens', () => {
  it('parses kebab-case custom tag attributes', () => {
    expect(parseCustomTagAttributes('title="Details" data-kind="secondary" open="true"')).toEqual({
      title: 'Details',
      'data-kind': 'secondary',
      open: 'true'
    })
  })

  it('tokenizes expandable blocks with collapsed default state', () => {
    const tokens = tokenizePageSectionSource(`
<d-expandable title="More details">

Hidden *content*.

</d-expandable>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'expandable',
      title: 'More details',
      open: false
    })
    expect(tokens[0].tokens).toHaveLength(1)
    expect(tokens[0].tokens[0]).toMatchObject({
      tag: 'p',
      content: 'Hidden <em>content</em>.'
    })
  })

  it('preserves rich nested content inside expandable blocks', () => {
    const tokens = tokenizePageSectionSource(`
<d-expandable title="Advanced" open="true">

> [!TIP]
> Keep it short.

  ~~~bash
echo "hi"
  ~~~

</d-expandable>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'expandable',
      title: 'Advanced',
      open: true
    })
    expect(tokens[0].tokens.map((token) => token.tag)).toEqual(['blockquote', 'code'])
    expect(tokens[0].tokens[0]).toMatchObject({
      alertType: 'tip'
    })
    expect(tokens[0].tokens[1]).toMatchObject({
      tag: 'code',
      info: 'bash',
      content: 'echo "hi"\n'
    })
  })

  it('flattens headings inside expandable blocks to keep the page toc stable', () => {
    const tokens = tokenizePageSectionSource(`
<d-expandable title="Flatten headings">

## Internal heading

Body copy.

</d-expandable>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0].tokens).toHaveLength(2)
    expect(tokens[0].tokens[0]).toMatchObject({
      tag: 'p',
      content: 'Internal heading'
    })
    expect(tokens[0].tokens[1]).toMatchObject({
      tag: 'p',
      content: 'Body copy.'
    })
  })

  it('keeps custom element syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-expandable title="Literal">inline</d-expandable>\` in docs.

~~~~html
<d-expandable title="Literal">

Body copy.

</d-expandable>
~~~~
`)

    expect(tokens.some((token) => token.tag === 'expandable')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-expandable title=&quot;Literal&quot;&gt;inline&lt;/d-expandable&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-expandable title="Literal">')
  })

  it('keeps quick links tokenization working', () => {
    const tokens = tokenizePageSectionSource(`
<d-quick-links title="Get started">
  <d-quick-link title="Install" description="Set up the project" to="/guide/getting-started" />
</d-quick-links>
`)

    expect(tokens).toEqual([
      {
        tag: 'quick-links',
        title: 'Get started',
        items: [
          {
            icon: 'link',
            title: 'Install',
            description: 'Set up the project',
            to: '/guide/getting-started',
            href: ''
          }
        ]
      }
    ])
  })

  it('renders markdown images inside paragraph output', () => {
    const tokens = tokenizePageSectionSource('![Architecture overview](/images/architecture.png)')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('<img')
    expect(tokens[0].content).toContain('src="/images/architecture.png"')
    expect(tokens[0].content).toContain('alt="Architecture overview"')
  })

  it('generates GitHub-compatible heading anchors for markdown sections', () => {
    const tokens = tokenizePageSectionSource(`
## Table of Contents

### Próximos passos?
`)

    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({
      tag: 'h2',
      anchorId: 'table-of-contents',
      content: 'Table of Contents'
    })
    expect(tokens[1]).toMatchObject({
      tag: 'h3',
      anchorId: 'próximos-passos',
      content: 'Próximos passos?'
    })
  })

  it('deduplicates repeated heading anchors in source order', () => {
    const tokens = tokenizePageSectionSource(`
## Install

## Install

### Install
`)

    expect(tokens.map((token) => token.anchorId)).toEqual([
      'install',
      'install-1',
      'install-2'
    ])
  })

  it('renders inline math inside paragraph tokens', () => {
    const tokens = tokenizePageSectionSource('Einstein wrote $E = mc^2$ in prose.')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('katex')
    expect(tokens[0].content).not.toContain('$E = mc^2$')
  })

  it('renders display math as standalone html output', () => {
    const tokens = tokenizePageSectionSource(`
$$
\\int_0^1 x^2 dx
$$
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'html'
    })
    expect(tokens[0].content).toContain('katex-display')
    expect(tokens[0].content).not.toContain('$$')
  })

  it('renders inline and display math inside alert blockquotes', () => {
    const tokens = tokenizePageSectionSource(`
> [!NOTE] Inline math $x^2$
>
> $$
> \\int_0^1 x^2 dx
> $$
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'blockquote',
      alertType: 'note'
    })
    expect(tokens[0].content).toContain('katex')
    expect(tokens[0].content).toContain('katex-display')
  })

  it('renders math inside expandable blocks', () => {
    const tokens = tokenizePageSectionSource(`
<d-expandable title="Math details">

Inline $a^2+b^2=c^2$.

$$
\\sum_{i=1}^{n} i
$$

</d-expandable>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'expandable',
      title: 'Math details'
    })
    expect(tokens[0].tokens).toHaveLength(2)
    expect(tokens[0].tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].tokens[0].content).toContain('katex')
    expect(tokens[0].tokens[1]).toMatchObject({
      tag: 'html'
    })
    expect(tokens[0].tokens[1].content).toContain('katex-display')
  })

  it('keeps math delimiters literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`$E = mc^2$\` literally.

~~~markdown
$$
\\int_0^1 x^2 dx
$$
~~~
`)

    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('<code>$E = mc^2$</code>')
    expect(tokens[0].content).not.toContain('katex')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'markdown'
    })
    expect(tokens[1].content).toContain('$$')
    expect(tokens[1].content).toContain('\\int_0^1 x^2 dx')
  })
})