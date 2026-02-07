## Overview

`DH1` through `DH6` are **heading components** that render section titles with anchor navigation support. Each heading level corresponds to a Markdown heading (`##` through `######`).

## Component Hierarchy

| Component | Markdown | HTML | Usage |
|-----------|----------|------|-------|
| `DH1` | `#` (implicit) | `<h1>` | Page title, auto-generated from i18n |
| `DH2` | `##` | `<h2>` | Main sections |
| `DH3` | `###` | `<h3>` | Sub-sections |
| `DH4` | `####` | `<h4>` | Detail sections |
| `DH5` | `#####` | `<h5>` | Minor sections |
| `DH6` | `######` | `<h6>` | Micro sections |

## DH1 — Page Title

DH1 is special — it doesn't receive content via props. Instead, it reads the page title from the i18n store:

```javascript
const heading = computed(() => &#123;
  const base = store.state.i18n.base
  return t('_.' + base + '._')
&#125;)
```

DH1 also **registers** itself as anchor `0` in the `useNavigator` composable, enabling the ToC tree to show the page title as the root node.

## DH2–DH6 — Section Titles

These components receive their content via the `value` prop (already rendered as HTML by `DPageSection`):

## Props (DH2–DH6)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `Number` | Yes | Anchor ID for navigation |
| `value` | `String` | Yes | HTML content of the heading |

## Anchor Navigation

Clicking any heading triggers the `navigate(id)` function from `useNavigator`, which:

1. Updates the URL hash to `#&#123;id&#125;`
2. Scrolls the viewport to the heading element
3. Highlights the heading in the ToC tree

## Node Registration

Each heading component (DH2+) calls `useNavigator().index(id)` on mount and update, which pushes a node into the `page/nodes` store, building the ToC tree dynamically as the page renders.

## Styling

Headings use standard HTML heading elements with `v-html` rendering. Custom styling can be applied through the global `app.sass` file or by targeting the heading tags directly.
