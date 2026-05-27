## Overview

`DPageExpandable` renders a collapsible content section backed by the Markdown custom element `<d-expandable>`.

It is designed for secondary content that should stay available without stretching the main reading flow. The body keeps the same rich Markdown features already available in page sections, including lists, blockquotes, code blocks, Mermaid diagrams, tables, raw HTML, and quick links.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `String` | `''` | Header label shown in the expandable trigger |
| `open` | `Boolean` | `false` | Initial expanded state |

## Slot

The default slot receives the parsed content body.

## HTML Example

The custom element can be authored directly in page Markdown:

````html
<d-expandable title="Why hide this content?">

Use expandable blocks when the main section should stay concise but readers may still need more detail.

</d-expandable>

### Open by Default

<d-expandable title="Release checklist" open="true">

- Review breaking changes
- Update screenshots
- Run smoke tests

</d-expandable>

### Rich Content

<d-expandable title="Deployment appendix">

> [!TIP]
> Keep the primary flow in the main section and move optional details here.

```bash
npm install
npm run build
```

</d-expandable>
````

## Notes

- Use `open="true"` when the section should start expanded.
- Keep page headings outside the expandable block. Headings inside the body are flattened to regular paragraphs so the page ToC stays stable.
- Avoid nesting one `<d-expandable>` inside another in this first version.