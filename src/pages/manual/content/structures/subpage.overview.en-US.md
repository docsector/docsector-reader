## Overview

Subpage is the standard routed documentation screen that composes a page container, the page title, and the rendered sections.

Under the hood, routed documentation uses `DSubpage` for this composition.

## How It Works

The implementation generates a deterministic numeric ID from the current route path using a hash function. This ID is passed to `DPageSection` to ensure unique component keys across page navigations.

## Template

```html
<d-page show-back-to-top-control>
  <header>
    <d-h1 :id="0" />
  </header>
  <main>
    <d-page-section :id="id" />
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

This ensures that each page generates a unique set of anchor IDs, preventing collisions when switching between pages.

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
