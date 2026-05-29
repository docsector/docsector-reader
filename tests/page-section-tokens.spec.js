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
<d-block-expandable title="More details">

Hidden *content*.

</d-block-expandable>
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
<d-block-expandable title="Advanced" open="true">

> [!TIP]
> Keep it short.

  ~~~bash
echo "hi"
  ~~~

</d-block-expandable>
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
<d-block-expandable title="Flatten headings">

## Internal heading

Body copy.

</d-block-expandable>
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

  it('tokenizes stepper blocks with multiple steps', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-stepper>
  <d-block-step title="Install dependencies">

Run the install command.

  </d-block-step>
  <d-block-step title="Start the app">

Use the dev server.

  </d-block-step>
</d-block-stepper>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'stepper'
    })
    expect(tokens[0].steps).toHaveLength(2)
    expect(tokens[0].steps[0]).toMatchObject({
      title: 'Install dependencies'
    })
    expect(tokens[0].steps[0].tokens).toHaveLength(1)
    expect(tokens[0].steps[0].tokens[0]).toMatchObject({
      tag: 'p',
      content: 'Run the install command.',
      anchorId: ''
    })
    expect(tokens[0].steps[1]).toMatchObject({
      title: 'Start the app'
    })
    expect(tokens[0].steps[1].tokens).toHaveLength(1)
    expect(tokens[0].steps[1].tokens[0]).toMatchObject({
      tag: 'p',
      content: 'Use the dev server.',
      anchorId: ''
    })
  })

  it('preserves icon overrides on stepper steps', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-stepper>
  <d-block-step
    title="Choose the runtime"
    icon="memory"
    active-icon="rocket_launch"
    done-icon="task_alt"
  >

Pick a runtime and continue.

  </d-block-step>
</d-block-stepper>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'stepper'
    })
    expect(tokens[0].steps).toHaveLength(1)
    expect(tokens[0].steps[0]).toMatchObject({
      title: 'Choose the runtime',
      icon: 'memory',
      activeIcon: 'rocket_launch',
      doneIcon: 'task_alt'
    })
  })

  it('preserves rich markdown inside stepper steps', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-stepper>
  <d-block-step title="Validate output">

> [!TIP]
> Review the console output first.

~~~bash
npm run dev
~~~

  </d-block-step>
</d-block-stepper>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0].steps).toHaveLength(1)
    expect(tokens[0].steps[0].tokens.map((token) => token.tag)).toEqual(['blockquote', 'code'])
    expect(tokens[0].steps[0].tokens[0]).toMatchObject({
      tag: 'blockquote',
      alertType: 'tip'
    })
    expect(tokens[0].steps[0].tokens[1]).toMatchObject({
      tag: 'code',
      info: 'bash',
      content: 'npm run dev\n'
    })
  })

  it('flattens headings inside stepper steps to keep the page toc stable', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-stepper>
  <d-block-step title="Internal section">

## Internal heading

Body copy.

  </d-block-step>
</d-block-stepper>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0].steps[0].tokens).toHaveLength(2)
    expect(tokens[0].steps[0].tokens[0]).toMatchObject({
      tag: 'p',
      content: 'Internal heading'
    })
    expect(tokens[0].steps[0].tokens[1]).toMatchObject({
      tag: 'p',
      content: 'Body copy.'
    })
  })

  it('keeps stepper syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-block-stepper><d-block-step title="Literal">body</d-block-step></d-block-stepper>\` in docs.

~~~~html
<d-block-stepper>
  <d-block-step title="Literal">

Body copy.

  </d-block-step>
</d-block-stepper>
~~~~
`)

    expect(tokens.some((token) => token.tag === 'stepper')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-stepper&gt;&lt;d-block-step title=&quot;Literal&quot;&gt;body&lt;/d-block-step&gt;&lt;/d-block-stepper&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-stepper>')
  })

  it('keeps custom element syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-block-expandable title="Literal">inline</d-block-expandable>\` in docs.

~~~~html
<d-block-expandable title="Literal">

Body copy.

</d-block-expandable>
~~~~
`)

    expect(tokens.some((token) => token.tag === 'expandable')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-expandable title=&quot;Literal&quot;&gt;inline&lt;/d-block-expandable&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-expandable title="Literal">')
  })

  it('tokenizes timeline blocks with rich markdown and nested Docsector blocks', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-timeline>
  <d-block-timeline-item date="2025-12-25">

<d-block-timeline-tag color="warning" icon="rocket_launch">beta</d-block-timeline-tag>
<d-block-timeline-tag color="secondary" text-color="white" label="release candidate" />

## A brand new update

> [!TIP]
> Review the release notes before rollout.

<d-block-quick-links title="Related links">
  <d-block-quick-link title="Install" description="Set up the project" to="/guide/getting-started" />
</d-block-quick-links>

~~~bash
npm run release
~~~

  </d-block-timeline-item>
</d-block-timeline>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'timeline'
    })
    expect(tokens[0].items).toHaveLength(1)
    expect(tokens[0].items[0]).toMatchObject({
      date: '2025-12-25',
      tags: [
        {
          label: 'beta',
          color: 'warning',
          textColor: '',
          icon: 'rocket_launch'
        },
        {
          label: 'release candidate',
          color: 'secondary',
          textColor: 'white',
          icon: ''
        }
      ],
      anchorId: '2025-12-25-a-brand-new-update'
    })
    expect(tokens[0].items[0].tokens.map((token) => token.tag)).toEqual([
      'p',
      'blockquote',
      'quick-links',
      'code'
    ])
    expect(tokens[0].items[0].tokens[0]).toMatchObject({
      tag: 'p',
      content: 'A brand new update'
    })
    expect(tokens[0].items[0].tokens[1]).toMatchObject({
      tag: 'blockquote',
      alertType: 'tip'
    })
    expect(tokens[0].items[0].tokens[2]).toMatchObject({
      tag: 'quick-links',
      title: 'Related links'
    })
    expect(tokens[0].items[0].tokens[3]).toMatchObject({
      tag: 'code',
      info: 'bash',
      content: 'npm run release\n'
    })
  })

  it('deduplicates generated timeline anchors for repeated dates and titles', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-timeline>
  <d-block-timeline-item date="2025-12-25">

## Shipping update

First entry.

  </d-block-timeline-item>
  <d-block-timeline-item date="2025-12-25">

## Shipping update

Second entry.

  </d-block-timeline-item>
</d-block-timeline>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0].items).toHaveLength(2)
    expect(tokens[0].items[0]).toMatchObject({
      anchorId: '2025-12-25-shipping-update'
    })
    expect(tokens[0].items[1]).toMatchObject({
      anchorId: '2025-12-25-shipping-update-1'
    })
  })

  it('preserves explicit timeline anchors', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-timeline>
  <d-block-timeline-item date="2025-12-25" anchor="General Availability Release">

## Shipping update

Stable anchor.

  </d-block-timeline-item>
</d-block-timeline>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0].items).toHaveLength(1)
    expect(tokens[0].items[0]).toMatchObject({
      anchorId: 'general-availability-release'
    })
  })

  it('keeps quick links tokenization working', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-quick-links title="Get started">
  <d-block-quick-link title="Install" description="Set up the project" to="/guide/getting-started" />
</d-block-quick-links>
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
<d-block-file src="/files/manual/cli-reference.pdf" title="CLI reference" size="2 MB">
Download the *full* command reference.
</d-block-file>
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
    const tokens = tokenizePageSectionSource('<d-block-file src="/files/releases/docsector-reader.zip" />')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'file',
      src: '/files/releases/docsector-reader.zip',
      title: 'docsector-reader.zip',
      size: '',
      caption: ''
    })
  })

  it('tokenizes self-closing code example blocks', () => {
    const tokens = tokenizePageSectionSource('<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter" expanded="true" scrollable="yes" overflow="on" height="320" />')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'code-example',
      codeIndex: 0,
      src: 'manual/code-examples/basic-counter',
      title: 'Basic counter',
      expanded: true,
      codepen: true,
      scrollable: true,
      overflow: true,
      height: '320',
      caption: ''
    })
  })

  it('tokenizes self-closing api blocks', () => {
    const tokens = tokenizePageSectionSource('<d-block-api src="/quasar-api/QBtn.json" title="Button API" page-link="true" />')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'api',
      src: '/quasar-api/QBtn.json',
      title: 'Button API',
      pageLink: true
    })
  })

  it('keeps api block syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-block-api src="/quasar-api/QBtn.json" />\` in docs.

~~~~html
<d-block-api src="/quasar-api/QBtn.json" />
~~~~
`)

    expect(tokens.some((token) => token.tag === 'api')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-api src=&quot;/quasar-api/QBtn.json&quot; /&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-api src="/quasar-api/QBtn.json" />')
  })

  it('tokenizes code example blocks with file alias, disabled codepen, and caption markdown', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-code-example file="manual/code-examples/basic-card.vue" title="Basic card" codepen="false">
Open the source to inspect the *Vue SFC*.
</d-block-code-example>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'code-example',
      src: 'manual/code-examples/basic-card.vue',
      title: 'Basic card',
      expanded: false,
      codepen: false,
      scrollable: false,
      overflow: false,
      height: '',
      caption: 'Open the source to inspect the <em>Vue SFC</em>.'
    })
  })

  it('increments code indexes around code example blocks', () => {
    const tokens = tokenizePageSectionSource(`
~~~bash
echo before
~~~

<d-block-code-example src="manual/code-examples/basic-counter" />

~~~bash
echo after
~~~
`)

    expect(tokens.map((token) => token.tag)).toEqual(['code', 'code-example', 'code'])
    expect(tokens[0]).toMatchObject({ codeIndex: 0 })
    expect(tokens[1]).toMatchObject({ codeIndex: 1 })
    expect(tokens[2]).toMatchObject({ codeIndex: 2 })
  })

  it('keeps code example syntax literal inside inline and fenced code', () => {
    const tokens = tokenizePageSectionSource(`
Use \`<d-block-code-example src="manual/demo" />\` in docs.

~~~~html
<d-block-code-example src="manual/demo" />
~~~~
`)

    expect(tokens.some((token) => token.tag === 'code-example')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-code-example src=&quot;manual/demo&quot; /&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-code-example src="manual/demo" />')
  })

  it('tokenizes embedded URL blocks with caption markdown', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-embedded-url url="https://www.youtube.com/watch?v=M7lc1UVf-VE" title="YouTube player demo">
Watch the *launch* recap.
</d-block-embedded-url>
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
<d-block-embedded-url url="https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P" />

### Fallback URL

<d-block-embedded-url url="https://example.com/docs/embed-me" title="API docs" />
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
Use \`<d-block-embedded-url url="https://example.com/demo"></d-block-embedded-url>\` in docs.

~~~~html
<d-block-embedded-url url="https://example.com/demo" />
~~~~
`)

    expect(tokens.some((token) => token.tag === 'embedded-url')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-embedded-url url=&quot;https://example.com/demo&quot;&gt;&lt;/d-block-embedded-url&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-embedded-url url="https://example.com/demo" />')
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

  it('no longer tokenizes the legacy cards syntax', () => {
    const tokens = tokenizePageSectionSource(`
<d-cards title="Legacy syntax">
  <d-card title="Legacy" description="Should stay raw" to="/docs" />
</d-cards>
`)

    expect(tokens).toEqual([
      {
        tag: 'html',
        content: '<d-cards title="Legacy syntax">\n  <d-card title="Legacy" description="Should stay raw" to="/docs" />\n</d-cards>\n'
      }
    ])
  })

  it('keeps a self-closing file block isolated from the next heading and file block', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-file src="/files/manual/release-checklist.txt" size="1 KB" />

### External file

<d-block-file src="https://example.com/example.pdf" title="Reference PDF" size="13 KB">
External caption.
</d-block-file>
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
<d-block-expandable title="Math details">

Inline $a^2+b^2=c^2$.

$$
\\sum_{i=1}^{n} i
$$

</d-block-expandable>
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
Use \`<d-block-file src="/files/manual/example.pdf" />\` in docs.

~~~~html
<d-block-file src="/files/manual/example.pdf" />
~~~~
`)

    expect(tokens.some((token) => token.tag === 'file')).toBe(false)
    expect(tokens[0]).toMatchObject({
      tag: 'p'
    })
    expect(tokens[0].content).toContain('&lt;d-block-file src=&quot;/files/manual/example.pdf&quot; /&gt;')
    expect(tokens[1]).toMatchObject({
      tag: 'code',
      info: 'html'
    })
    expect(tokens[1].content).toContain('<d-block-file src="/files/manual/example.pdf" />')
  })
})