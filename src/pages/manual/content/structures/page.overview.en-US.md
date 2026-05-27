## Overview

Page is the main documentation screen container.

It provides the scroll area, the subpage toolbar, the right-side table of contents drawer, and the footer navigation area. Under the hood, this is powered by `DPage`.

This manual entry intentionally stays overview-only because the container behavior is easier to explain than to demonstrate in isolation.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disableNav` | `Boolean` | `false` | Hides the DPageMeta navigation footer |
| `showBackToTopControl` | `Boolean` | `false` | Enables the floating back-to-top control with circular reading progress |

## Layout Structure

A page provides the following layout pieces:

- **QPageContainer** — Quasar page container
- **QToolbar** (submenu) — Tab navigation: Overview, Showcase, Vs
- **QPage** with **QScrollArea** — Scrollable content area with slot
- **QDrawer** (right) — Anchor/ToC navigation tree

## Content Slot

The default slot receives the page content. In routed documentation, a Subpage typically places the title and rendered sections inside this slot:

```html
<d-page>
  <header>
    <d-h1 :id="0" />
  </header>
  <main>
    <d-page-section :id="sectionId" />
  </main>
</d-page>
```

## Subpage Tabs

The page container reads the route's `meta.subpages` configuration to determine which tabs to display:

- **Overview** — Always shown when other tabs exist
- **Showcase** — Shown when `subpages.showcase: true`
- **Vs** — Shown when `subpages.vs: true`

## Scroll Behavior

The page container resets scroll position on route changes via `router.beforeEach`. The scroll observer monitors vertical position and updates the selected anchor via the `useNavigator` composable.

When `showBackToTopControl` is enabled, the page also derives reading progress from the same scroll container. The floating control stays hidden at the top, appears after a small amount of scroll, shows circular progress, and returns to anchor `0` when clicked.

## Store Integration

The implementation reads from and writes to several Vuex store modules:

- `layout/meta` — Controls the right-side anchor drawer visibility
- `page/base` — Current page base path
- `page/relative` — Current subpage path (`/overview`, `/showcase`, `/vs`)
- `page/anchor` — Resets anchors on navigation
