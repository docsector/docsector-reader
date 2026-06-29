## Overview

Subpage is the standard routed documentation screen that composes a page container, the page title, and the rendered sections.

Under the hood, routed documentation uses `DSubpage` for this composition.

## How It Works

The implementation generates a deterministic numeric ID from the current route path using a hash function. This ID is passed to `DPageSection` to keep per-page renderer indexes stable across page navigations.

## Subpage templates

Subpages render free-form Markdown by default (the `freestyle` template). A subpage can instead opt into a **structured template** that owns a fixed set of sections, declared per subpage in the page registry:

```javascript
// src/pages/manual.index.js
'/WPI/HTTP/HTTP_Server_CLI': &#123;
  config: &#123;
    subpages: &#123;
      vs: &#123; template: 'vs' &#125;   // enable the `vs` subpage with the `vs` template
    &#125;
  &#125;
&#125;
```

The boolean shorthand (`showcase: true`) still means "enabled, freestyle". The object form `&#123; template: '<name>' &#125;` selects a template.

### Built-in templates

| Template | Structure |
|---|---|
| `freestyle` (default) | No fixed structure — Markdown renders as written |
| `vs` | Fixed comparison sections: Features, Performance, Security |

### Managed (strict) rendering

Structured templates are **managed**: the template owns the section titles, icons and order. In the Markdown you write one `##` heading per section (its slug must match a section key — or one of its localized titles); the renderer then:

- renders sections in the template's canonical order,
- replaces each heading with the template's localized title,
- gracefully omits sections you do not include (so a page with partial data just leaves them out),
- warns in the dev console about unknown headings and appends them after the canonical sections.

Every `vs` subpage therefore shares the same structure. Templates are resolved by `resolveSubpageTemplate()` (`src/page-template.js`) and applied by `applyTemplateSections()` (`src/components/page-template-sections.js`).

Inside comparison tables the engine colorizes the marks `✓` / `✗` / `➕` and highlights the column whose header matches your project's `branding.name`. The engine stays product-agnostic — the highlighted column is configured by the consumer (via `branding.name` in `docsector.config.js`), not hardcoded.

## Template

```html
<d-page show-back-to-top-control>
  <header>
    <d-h1 :id="0" />
  </header>
  <main>
    <d-page-section :id="id" :template="template" />
  </main>
</d-page>
```

## ID Generation

The `id` computed property creates a consistent hash from the route path:

```javascript
const id = computed(() => &#123;
  const path = route.path
  let hash = 5381
  for (let i = 0; i < path.length; i++) &#123;
    hash = (hash * 33) ^ path.charCodeAt(i)
  &#125;
  return hash >>> 0
&#125;)
```

This keeps per-page renderer state isolated when switching between pages. Markdown section headings themselves use GitHub-compatible slugs derived from the heading text, so README-style Table of Contents links keep working.

## When to Use

Subpage is automatically used by the router for standard documentation routes. You usually do not need to wire it manually unless creating a custom layout.

```javascript
// In routes.js - this happens automatically
&#123;
  path: 'overview',
  component: () => import('components/DSubpage.vue'),
  meta: &#123; status: config.status &#125;
&#125;
```

## Relationship with Page

- Subpage uses the Page container as its layout shell
- Page handles scroll, toolbar, and drawer behavior
- Subpage handles title and section composition

## Built-in Back to Top Control

Routed documentation subpages enable the floating back-to-top control automatically. The control is only shown when the content actually overflows, becomes visible after the reader scrolls a little, and visualizes the current reading progress with a circular indicator.
