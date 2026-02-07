## Overview

`DPage` is the **main page container** component. It provides the scroll area, submenu toolbar (Overview/Showcase/Vs tabs), the right-side anchor drawer, and the `DPageMeta` footer.

Every documentation page is rendered inside a `DPage` instance.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disableNav` | `Boolean` | `false` | Hides the DPageMeta navigation footer |

## Template Structure

DPage renders the following layout:

- **QPageContainer** — Quasar page container
- **QToolbar** (submenu) — Tab navigation: Overview, Showcase, Vs
- **QPage** with **QScrollArea** — Scrollable content area with slot
- **QDrawer** (right) — Anchor/ToC navigation tree

## Slot

The default slot receives the page content. Typically, `DSubpage` places `DH1` and `DPageSection` inside this slot:

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

DPage reads the route's `meta.subpages` configuration to determine which tabs to display:

- **Overview** — Always shown when other tabs exist
- **Showcase** — Shown when `subpages.showcase: true`
- **Vs** — Shown when `subpages.vs: true`

## Scroll Behavior

DPage resets the scroll position on route changes via `router.beforeEach`. The scroll observer monitors vertical scroll position and updates the anchor selection via the `useNavigator` composable.

## Store Integration

DPage reads from and writes to several Vuex store modules:

- `layout/meta` — Controls the right-side anchor drawer visibility
- `page/base` — Current page base path
- `page/relative` — Current subpage path (`/overview`, `/showcase`, `/vs`)
- `page/anchor` — Resets anchors on navigation
