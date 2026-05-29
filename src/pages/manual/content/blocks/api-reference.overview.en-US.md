## Overview

API Reference blocks render a JSON document that follows the existing Quasar API schema directly inside Markdown.

This keeps the viewer compatible with Quasar-style API files while still allowing non-Vue APIs to reuse the same section model for props, methods, events, values, arguments, and config shapes.

The block is authored with the custom Markdown element `<d-block-api>`.

## Markdown Syntax

```html
<d-block-api src="/quasar-api/QSeparator.json" />

<d-block-api
  src="/api/manual/http-client.json"
  title="HTTP Client API"
  page-link="true"
/>
```

## Attributes

| Attribute | Purpose |
|-----------|---------|
| `src` | Same-origin JSON path to fetch in the browser |
| `title` | Optional header override shown above the API card |
| `page-link` | Shows the Docs button when the JSON has `meta.docsUrl` |

## JSON Source Model

- The first implementation follows the same delivery model as Quasar Docs: the JSON file is served as a public asset and fetched on demand.
- No Docsector-specific schema is required. If your file already follows the Quasar API structure, it can be rendered as-is.
- Non-Vue APIs can still use the same shape by filling the sections they need, such as `props`, `methods`, `events`, `value`, `arg`, or `quasarConfOptions`.

## Notes

- `props` are grouped into subtabs when more than one `category` is present.
- Entries marked with `internal: true` are hidden from the rendered block.
- The current version expects same-origin JSON assets so the browser can fetch them without CORS workarounds.
- If the JSON exposes `meta.docsUrl`, `page-link="true"` can surface a Docs button without changing the schema.