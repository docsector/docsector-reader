## Overview

`DPageBlockquote` renders **styled blockquotes** with semantic categorization. It now powers both:

- GitHub-style alert blockquotes from Markdown (`> [!TYPE]`)
- Regular blockquotes (`> ...`) without an alert marker

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `String` | `''` | Type of alert: `'note'`, `'tip'`, `'important'`, `'warning'`, or `'caution'` |

## Slot

The default slot receives the blockquote content.

## Message Types

| Type | Label | Purpose |
|------|-------|---------|
| `note` | **Note** | Additional context and references |
| `tip` | **Tip** | Practical recommendation or best practice |
| `important` | **Important** | Critical information the reader must know |
| `warning` | **Warning** | Potential pitfalls or breaking changes |
| `caution` | **Caution** | High-risk action that deserves extra care |
| (empty) | *(none)* | Generic blockquote with no label |

## Usage

GitHub alert syntax in Markdown:

```markdown
> [!WARNING]
> This operation may interrupt workers.
```

Regular blockquote syntax in Markdown:

```markdown
> This is a regular blockquote.
```

You can also use the component directly:

```html
<d-page-blockquote message="note">
  <p>This is additional context.</p>
</d-page-blockquote>

<d-page-blockquote message="tip">
  <p>This is a practical recommendation.</p>
</d-page-blockquote>

<d-page-blockquote message="warning">
  <p>Be careful with this operation!</p>
</d-page-blockquote>

<d-page-blockquote message="caution">
  <p>This is a high-risk warning.</p>
</d-page-blockquote>
```

## Styling

The component renders a standard `<blockquote>` element with alert-specific classes when a `message` is provided. Appearance is controlled in global `app.sass`, including dark/light mode variants for each alert type.
