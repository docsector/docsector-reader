## Overview

`DPageSection` is the **Markdown rendering engine** at the heart of Docsector Reader. It tokenizes Markdown source from the current i18n path and renders each token as the appropriate Vue component.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `Number` | Yes | Base ID used for anchor generation |

## How It Works

1. Reads the Markdown source from the i18n store path `_.&#123;absolute&#125;.source`
2. Parses it with **markdown-it** + **markdown-it-attrs**
3. Tokenizes the parsed AST into a flat array of renderable tokens
4. Each token is rendered as the corresponding Docsector component

## Token Types and Rendering

| Markdown | Token Tag | Component |
|----------|-----------|-----------|
| `## Heading 2` | `h2` | `DH2` |
| `### Heading 3` | `h3` | `DH3` |
| `#### Heading 4` | `h4` | `DH4` |
| `##### Heading 5` | `h5` | `DH5` |
| `###### Heading 6` | `h6` | `DH6` |
| Paragraph text | `p` | `<p v-html>` |
| Unordered list | `ul` | `<ul v-html>` |
| Ordered list | `ol` | `<ol v-html>` |
| Table | `table` | `<table v-html>` |
| Fenced code block | `code` | `DPageSourceCode` |

## Nesting Support

DPageSection handles one level of nesting for:

- Bullet lists (`ul > li`)
- Ordered lists (`ol > li`)
- Tables (`table > thead/tbody > tr > th/td`)

Nested content is accumulated into a single HTML string and rendered with `v-html`.

## Custom Attributes

The `markdown-it-attrs` plugin uses `:` and `;` as delimiters. Currently, only the `filename` attribute is used:

```
:filename="server.php";
```

This attribute is extracted from fenced code blocks and passed to `DPageSourceCode` for display.

## Anchor IDs

Each heading token receives an anchor ID calculated as `id + token.map[0]`, where `token.map[0]` is the source line number. This creates unique, deterministic anchors for the ToC tree.
