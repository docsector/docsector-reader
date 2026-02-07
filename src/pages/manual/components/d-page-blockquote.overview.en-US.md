## Overview

`DPageBlockquote` renders **styled blockquotes** with semantic categorization. It supports three message types: important, warning, and note — each with a distinct visual label.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `String` | `''` | Type of blockquote: `'important'`, `'warning'`, or `'note'` |

## Slot

The default slot receives the blockquote content.

## Message Types

| Type | Label | Purpose |
|------|-------|---------|
| `important` | **Important** | Critical information the reader must know |
| `warning` | **Warning** | Potential pitfalls or breaking changes |
| `note` | **Note** | Additional context or tips |
| (empty) | *(none)* | Generic blockquote with no label |

## Usage

DPageBlockquote is not currently auto-rendered by DPageSection from Markdown blockquotes. To use it, you would include it directly in a custom component:

```html
<d-page-blockquote message="important">
  <p>This is critically important information.</p>
</d-page-blockquote>

<d-page-blockquote message="warning">
  <p>Be careful with this operation!</p>
</d-page-blockquote>

<d-page-blockquote message="note">
  <p>This is an optional tip for advanced users.</p>
</d-page-blockquote>
```

## Styling

The component renders a standard `<blockquote>` element. The `<strong>` label is conditionally shown based on the `message` prop. Customize the appearance in your global `app.sass` or by targeting `blockquote` in your CSS.
