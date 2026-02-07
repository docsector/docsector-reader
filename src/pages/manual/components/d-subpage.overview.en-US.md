## Overview

`DSubpage` is a **convenience wrapper** that composes `DPage`, `DH1`, and `DPageSection` into a standard documentation page layout. It is the component loaded by the router for every subpage route.

## How It Works

DSubpage generates a deterministic numeric ID from the current route path using a hash function. This ID is passed to `DPageSection` to ensure unique component keys across page navigations.

## Template

```html
<d-page>
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

DSubpage is automatically used by the router for all documentation pages. You don't need to use it directly unless creating custom page layouts. For standard documentation, the router handles everything:

```javascript
// In routes.js - this happens automatically
&#123;
  path: 'overview',
  component: () => import('components/DSubpage.vue'),
  meta: &#123; status: config.status &#125;
&#125;
```

## Relationship with DPage

- `DSubpage` **uses** `DPage` as its container
- `DPage` handles layout (scroll, toolbar, drawer)
- `DSubpage` handles content composition (H1 + sections)
