## Overview

Table of Contents is the **right-side navigation tree** that lists the headings of the current page.

Under the hood, this behavior is powered by `DPageAnchor`.

## How It Works

1. `DPageSection` tokenizes the current subpage and rebuilds the heading tree in source order
2. `DPageAnchor` reads the `page/nodes` getter to render the tree
3. When the user scrolls, the scroll observer in `DPage` updates the selected anchor
4. Clicking a tree node navigates to the corresponding heading

## Store Integration

The implementation interacts with these store state/getters:

- `page/nodes` — The tree structure of headings
- `page/nodesExpanded` — Which tree nodes are expanded
- `page/anchor` — Currently selected heading ID
- `layout/metaToggle` — Controls drawer visibility

## Tree Rendering

Uses Quasar's `QTree` component with `default-expand-all`. The node key is the heading `id`, and the label is the heading text. H2 tokens become top-level tree entries, and H3 tokens nest under the nearest preceding H2.

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

When the user scrolls the page content, the `DPage` scroll observer calls `useNavigator().scrolling()`, which selects the last registered heading that crossed the content threshold. Missing or stale anchors are ignored so the table of contents stays in sync with the visible section instead of jumping ahead.

## Lifecycle

- **onMounted** — Enables meta toggle, starts scroll tracking after 1s delay, anchors to URL hash if present
- **onBeforeUnmount** — Resets anchors, nodes, and disables scroll tracking

## Styling

The tree uses Quasar's default tree styling with custom colors for light/dark modes. Selected nodes get the primary color background. Heading text is displayed in bold at 15px.
