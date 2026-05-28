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

  it('tokenizes cards blocks with optional cover images', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-cards title="Explore more">
  <d-block-card
    title="Install"
    description="Set up the project"
    to="/guide/getting-started"
    image="/images/cards/install.png"
  />
  <d-block-card
    title="GitHub"
    description="Open the repository"
    href="https://github.com/docsector/docsector-reader"
    icon="launch"
  />
</d-block-cards>
`)

    expect(tokens).toEqual([
      {
        tag: 'cards',
        title: 'Explore more',
        items: [
          {
            title: 'Install',
            description: 'Set up the project',
            to: '/guide/getting-started',
            href: '',
            image: '/images/cards/install.png',
            icon: ''
          },
          {
            title: 'GitHub',
            description: 'Open the repository',
            to: '',
            href: 'https://github.com/docsector/docsector-reader',
            image: '',
            icon: 'launch'
          }
        ]
      }
    ])
  })

  it('ignores incomplete cards when tokenizing cards blocks', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-cards title="Resources">
  <d-block-card title="Valid" description="Visible item" to="/manual/content/blocks/cards" />
  <d-block-card title="Missing link" description="This should be ignored" />
  <d-block-card title="Missing description" href="https://example.com" />
</d-block-cards>
`)

    expect(tokens).toEqual([
      {
        tag: 'cards',
        title: 'Resources',
        items: [
          {
            title: 'Valid',
            description: 'Visible item',
            to: '/manual/content/blocks/cards',
            href: '',
            image: '',
            icon: ''
          }
        ]
      }
    ])
  })

  it('tokenizes file blocks with caption markdown', () => {
    const tokens = tokenizePageSectionSource(`
<d-file src="/files/manual/cli-reference.pdf" title="CLI reference" size="2 MB">
Download the *full* command reference.
</d-file>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'file',
      src: '/files/manual/cli-reference.pdf',
      title: 'CLI reference',
      size: '2 MB',
      caption: 'Download the <em>full</em> command reference.'
    })
  })

  it('falls back to the file name for self-closing file blocks', () => {
    const tokens = tokenizePageSectionSource('<d-file src="/files/releases/docsector-reader.zip" />')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'file',
      src: '/files/releases/docsector-reader.zip',
      title: 'docsector-reader.zip',
      size: '',
      caption: ''
    })
  })

  it('tokenizes embedded URL blocks with caption markdown', () => {
    const tokens = tokenizePageSectionSource(`
<d-embedded-url url="https://www.youtube.com/watch?v=M7lc1UVf-VE" title="YouTube player demo">
Watch the *launch* recap.
</d-embedded-url>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'embedded-url',
      url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      title: 'YouTube player demo',
      caption: 'Watch the <em>launch</em> recap.'
    })
  })

  it('keeps a self-closing embedded URL block isolated from surrounding markdown', () => {
    const tokens = tokenizePageSectionSource(`
<d-embedded-url url="https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P" />

### Fallback URL

<d-embedded-url url="https://example.com/docs/embed-me" title="API docs" />
`)

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({
      tag: 'embedded-url',
      url: 'https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P',
      title: '',
      caption: ''
    })
    expect(tokens[1]).toMatchObject({
      tag: 'h3',
      content: 'Fallback URL'
    })
    expect(tokens[2]).toMatchObject({
      tag: 'embedded-url',
      url: 'https://example.com/docs/embed-me',
      title: 'API docs'
    })
  })

  it('keeps embedded URL syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-embedded-url url="https://example.com/demo"></d-embedded-url>\` in docs.

~~~~html
<d-embedded-url url="https://example.com/demo" />
~~~~
`)

    expect(tokens.some((token) => token.tag === 'embedded-url')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-embedded-url url=&quot;https://example.com/demo&quot;&gt;&lt;/d-embedded-url&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-embedded-url url="https://example.com/demo" />')
  })

  it('keeps cards syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-block-cards><d-block-card title="Literal" description="Example" to="/docs" /></d-block-cards>\` in docs.

~~~~html
<d-block-cards title="Literal">
  <d-block-card title="Literal" description="Example" to="/docs" />
</d-block-cards>
~~~~
`)

    expect(tokens.some((token) => token.tag === 'cards')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-cards&gt;&lt;d-block-card title=&quot;Literal&quot; description=&quot;Example&quot; to=&quot;/docs&quot; /&gt;&lt;/d-block-cards&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-cards title="Literal">')
  })

  it('keeps a self-closing file block isolated from the next heading and file block', () => {
    const tokens = tokenizePageSectionSource(`
<d-file src="/files/manual/release-checklist.txt" size="1 KB" />

### External file

<d-file src="https://example.com/example.pdf" title="Reference PDF" size="13 KB">
External caption.
</d-file>
`)

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({
      tag: 'file',
      src: '/files/manual/release-checklist.txt',
      title: 'release-checklist.txt'
    })
    expect(tokens[1]).toMatchObject({
      tag: 'h3',
      content: 'External file'
    })
    expect(tokens[2]).toMatchObject({
      tag: 'file',
      src: 'https://example.com/example.pdf',
      title: 'Reference PDF',
      caption: 'External caption.'
    })
  })

  it('promotes standalone markdown images to image tokens with caption metadata', () => {
    const tokens = tokenizePageSectionSource('![Architecture overview](/images/architecture.png "System diagram")')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'image',
      alt: 'Architecture overview',
      captionHtml: 'Architecture overview',
      title: 'System diagram'
    })
    expect(tokens[0].content).toContain('<img')
    expect(tokens[0].content).toContain('src="/images/architecture.png"')
    expect(tokens[0].content).toContain('alt="Architecture overview"')
    expect(tokens[0].content).toContain('title="System diagram"')
  })

  it('keeps mixed paragraph content on the paragraph path when an image is inline with text', () => {
    const tokens = tokenizePageSectionSource('Text before ![Architecture overview](/images/architecture.png) and after.')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('Text before')
    expect(tokens[0].content).toContain('<img')
    expect(tokens[0].content).toContain('and after.')
  })

  it('normalizes raw figure blocks with separate alt and caption values', () => {
    const tokens = tokenizePageSectionSource(`
<figure><img src="/images/gitbook.png" alt="The GitBook Logo"><figcaption><p>GitBook Logo</p></figcaption></figure>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'image',
      alt: 'The GitBook Logo',
      captionHtml: '<p>GitBook Logo</p>',
      title: ''
    })
    expect(tokens[0].content).toContain('<img')
    expect(tokens[0].content).toContain('src="/images/gitbook.png"')
  })

  it('normalizes raw figure blocks with picture content', () => {
    const tokens = tokenizePageSectionSource(`
<figure>
  <picture>
    <source srcset="/images/github-dark.png" media="(prefers-color-scheme: dark)">
    <img src="/images/github-light.png" alt="GitHub logo">
  </picture>
  <figcaption>Caption text</figcaption>
</figure>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'image',
      alt: 'GitHub logo',
      captionHtml: 'Caption text'
    })
    expect(tokens[0].content).toContain('<picture>')
    expect(tokens[0].content).toContain('prefers-color-scheme: dark')
    expect(tokens[0].content).toContain('<img src="/images/github-light.png" alt="GitHub logo">')
  })

  it('falls back to raw html for unsupported figure wrappers', () => {
    const source = `
<figure>
  <div data-with-frame="true">
    <img src="/images/gitbook.png" alt="The GitBook Logo">
  </div>
  <figcaption>GitBook Logo</figcaption>
</figure>
`
    const tokens = tokenizePageSectionSource(source)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'html'
    })
    expect(tokens[0].content.trim()).toBe(source.trim())
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

  it('preserves nested unordered list markup inside the root list token', () => {
    const tokens = tokenizePageSectionSource(`
- Documentation workflow
  - Write the overview page
  - Add the showcase page
- Release workflow
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'ul'
    })
    expect(tokens[0].content).toContain('<li>Documentation workflow<ul><li>Write the overview page</li><li>Add the showcase page</li></ul></li>')
    expect(tokens[0].content).toContain('<li>Release workflow</li>')
  })

  it('renders markdown task lists as checkbox markup on the root list token', () => {
    const tokens = tokenizePageSectionSource(`
- [ ] Write the overview page
- [x] Publish the release notes
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'ul',
      attrs: {
        class: 'contains-task-list'
      }
    })
    expect(tokens[0].content).toContain('class="task-list-item"')
    expect(tokens[0].content).toContain('class="task-list-item-checkbox"')
    expect(tokens[0].content).toMatch(/<input[^>]*disabled(?:="")?[^>]*type="checkbox"|<input[^>]*type="checkbox"[^>]*disabled(?:="")?[^>]*>/)
    expect(tokens[0].content).toMatch(/<input[^>]*checked(?:="")?[^>]*type="checkbox"|<input[^>]*type="checkbox"[^>]*checked(?:="")?[^>]*>/)
  })

  it('preserves nested task list hierarchy and attributes', () => {
    const tokens = tokenizePageSectionSource(`
- [ ] Release workflow
  - [x] Update the changelog
  - [ ] Publish the package
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'ul',
      attrs: {
        class: 'contains-task-list'
      }
    })
    expect(tokens[0].content).toContain('<ul class="contains-task-list">')
    expect(tokens[0].content).toContain('Update the changelog')
    expect(tokens[0].content).toContain('Publish the package')
  })

  it('preserves nested ordered list markup inside the root list token', () => {
    const tokens = tokenizePageSectionSource(`
1. Prepare the change.
   1. Confirm the route path.
   2. Check the required markdown files.
2. Validate the result.
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'ol'
    })
    expect(tokens[0].content).toContain('<li>Prepare the change.<ol><li>Confirm the route path.</li><li>Check the required markdown files.</li></ol></li>')
    expect(tokens[0].content).toContain('<li>Validate the result.</li>')
  })

  it('supports three levels of nested unordered lists', () => {
    const tokens = tokenizePageSectionSource(`
- Level 1
  - Level 2
    - Level 3
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'ul'
    })
    expect(tokens[0].content).toContain('<li>Level 1<ul><li>Level 2<ul><li>Level 3</li></ul></li></ul></li>')
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

  it('keeps markdown task markers literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`- [ ] literal task marker\` in docs.

~~~markdown
- [x] keep literal in code
~~~
`)

    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('<code>- [ ] literal task marker</code>')
    expect(tokens[0].content).not.toContain('task-list-item-checkbox')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'markdown'
    })
    expect(tokens[1].content).toContain('- [x] keep literal in code')
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

  it('keeps file block syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-file src="/files/manual/example.pdf" />\` in docs.

~~~~html
<d-file src="/files/manual/example.pdf" />
~~~~
`)

    expect(tokens.some((token) => token.tag === 'file')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-file src=&quot;/files/manual/example.pdf&quot; /&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-file src="/files/manual/example.pdf" />')
  })
})