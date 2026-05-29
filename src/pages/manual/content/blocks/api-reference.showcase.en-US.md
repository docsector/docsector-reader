## Showcase

### Quasar JSON Without Refactoring

This example renders a real Quasar API JSON file copied into `public/quasar-api/`.

<d-block-api src="/quasar-api/QSeparator.json" />

### Generic SDK JSON With the Same Schema

This example uses the same section model for a non-Vue HTTP client and also enables the optional Docs button.

<d-block-api src="/api/manual/http-client.json" title="HTTP Client API" page-link="true" />

## Authoring Syntax

```html
<d-block-api src="/quasar-api/QSeparator.json" />

<d-block-api
  src="/api/manual/http-client.json"
  title="HTTP Client API"
  page-link="true"
/>
```

## Features Visible Above

- **Quasar JSON compatibility** with a real file served from `public/quasar-api/`
- **Generic API support** without introducing a new schema
- **Local filter** across names and descriptions inside the loaded API sections
- **Grouped props subtabs** when multiple categories exist in the JSON
- **Optional Docs link** when `meta.docsUrl` is present and `page-link="true"` is used