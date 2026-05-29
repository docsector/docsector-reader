# Docsector Page Structure

Use this reference when adding or editing Docsector content files, assets, examples, and API reference data.

## Page Sources

Docsector pages are registered in index files such as `src/pages/manual.index.js` and backed by localized Markdown files under `src/pages/`.

Manual content blocks follow this pattern:

```text
src/pages/manual/content/blocks/{block}.overview.en-US.md
src/pages/manual/content/blocks/{block}.showcase.en-US.md
src/pages/manual/content/blocks/{block}.overview.pt-BR.md
src/pages/manual/content/blocks/{block}.showcase.pt-BR.md
```

The route path maps to MCP/page paths such as:

```text
manual/content/blocks/cards/overview
manual/content/blocks/cards/showcase
```

## Overview and Showcase

Use `overview` for conceptual explanation, syntax, attributes, and authoring notes. Use `showcase` for varied examples that demonstrate the block in realistic content.

Most block docs should include both subpages. Structure docs such as page, subpage, or books may use different subpage rules depending on their registry configuration.

## Localization

Localized Markdown files use locale suffixes such as `.en-US.md` and `.pt-BR.md`. Keep route structure and headings aligned across locales when possible so translation progress and navigation remain useful.

New repository-facing documentation and AI customization files should be written in English unless the file is explicitly a locale-specific translation.

## Assets

Use public site paths in Markdown:

| Asset Type      | Repo Location           | Public Path       |
| --------------- | ----------------------- | ----------------- |
| Images          | `public/images/...`     | `/images/...`     |
| Files           | `public/files/...`      | `/files/...`      |
| Manual API JSON | `public/api/manual/...` | `/api/manual/...` |
| Quasar API JSON | `public/quasar-api/...` | `/quasar-api/...` |

Prefer absolute public paths in documentation so pages keep working when routes move.

## Code Examples

Live code examples are Vue SFC files discovered from `src/examples/**/*.vue`.

Reference them with:

```html
<d-block-code-example
  src="manual/code-examples/basic-counter"
  title="Basic counter"
/>
```

The `src` value is normalized to kebab-case and resolves to a PascalCase `.vue` file. For example, `manual/code-examples/basic-counter` resolves to `src/examples/manual/code-examples/BasicCounter.vue`.

Use `file` as an alias for `src` only when migrating from Quasar Docs-style examples.

## API Reference JSON

API blocks fetch JSON from same-origin public assets:

```html
<d-block-api
  src="/api/manual/http-client.json"
  title="HTTP Client API"
  page-link="true"
/>
```

The JSON can follow Quasar's API schema. Useful sections include `props`, `methods`, `events`, `value`, `arg`, and `quasarConfOptions`. Entries marked `internal: true` are hidden.

## Navigation and Metadata

Page registry entries in `src/pages/*.index.js` define titles, status, icons, books, menu placement, subpage availability, descriptions, and search tags.

When adding new content, check the nearest existing entry and keep metadata consistent with that section.

## Authoring Rules

- Prefer Markdown for simple content.
- Use custom elements only when they add structure, interaction, or a clearer reading path.
- Use `to` for internal Docsector routes and `href` for external URLs.
- Avoid repeating the same Markdown source in multiple routes.
- Keep page headings outside Expandable, Stepper, and Timeline bodies when they are meant to appear in the page-level table of contents.
- Avoid unsupported nested custom block combinations unless current manual docs explicitly show the pattern.

## Validation Pointers

- Parser behavior is centered in `src/components/page-section-tokens.js`.
- Rendering is dispatched by `src/components/DPageTokens.vue`.
- Manual block registration is covered by `tests/manual-content-showcases.spec.js`.
- Parser and block edge cases are covered by focused tests such as `tests/page-section-tokens.spec.js`, `tests/code-example-source.spec.js`, `tests/embedded-url-providers.spec.js`, and `tests/api-block-model.spec.js`.
