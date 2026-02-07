## Overview

`DPageAnchor` renders the **Table of Contents (ToC) tree** in the right-side drawer. It displays a navigable tree of all headings on the current page, allowing users to jump directly to any section.

## How It Works

1. As each heading component (DH1–DH6) mounts, it registers itself in the `page/nodes` store via `useNavigator`
2. `DPageAnchor` reads the `page/nodes` getter to render the tree
3. When the user scrolls, the scroll observer in `DPage` updates the selected anchor
4. Clicking a tree node navigates to the corresponding heading

## Store Integration

DPageAnchor interacts with these store state/getters:

- `page/nodes` — The tree structure of headings
- `page/nodesExpanded` — Which tree nodes are expanded
- `page/anchor` — Currently selected heading ID
- `layout/metaToggle` — Controls drawer visibility

## Tree Rendering

Uses Quasar's `QTree` component with `default-expand-all`. The node key is the heading's numeric `id`, and the label is the heading text.

The root node (from DH1) shows the page title from i18n when no label is set:

```html
<template v-slot:default-header="props">
  <b v-if="props.node.label">
    &#123;&#123; props.node.label &#125;&#125;
  </b>
  <b v-else>
    &#123;&#123; $t('_.' + $store.state.i18n.base + '._') &#125;&#125;
  </b>
</template>
```

## Scroll Synchronization

When the user scrolls the page content, the `DPage` scroll observer calls `useNavigator().scrolling()`, which iterates over registered anchors and selects the one closest to the current scroll position. This keeps the ToC tree in sync with the visible content.

## Lifecycle

- **onMounted** — Enables meta toggle, starts scroll tracking after 1s delay, anchors to URL hash if present
- **onBeforeUnmount** — Resets anchors, nodes, and disables scroll tracking

## Styling

The tree uses Quasar's default tree styling with custom colors for light/dark modes. Selected nodes get the primary color background. Heading text is displayed in bold at 15px.
