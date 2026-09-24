## Overview

Navigation Menu is the **left sidebar** used to explore the documentation.

Under the hood, this page describes the `DMenu` implementation.

## Focused Pages in Basic

- [Search](/manual/basic/search/overview/)
- [Branding](/manual/basic/branding/overview/)
- [Version Switcher](/manual/basic/version-switcher/overview/)

## Features

- **Search** — Filter pages by searching content, titles, and tags
- **Branding section** — Logo, project name, version selector
- **Top links** — Changelog, roadmap and sponsor: URLs open in a new tab, pages of the site open in place
- **Explore section** — Custom links, with the same rule
- **Footer buttons** — Website, GitHub, discussions, chat, email
- **Page tree** — Auto-generated from the page registry with expansion panels

## Search

The search input at the top of the menu filters pages by matching the search term against:

1. **Tags** — Defined per page in `src/pages/*.index.js` under `metadata.tags`
2. **Page content** — The Markdown source of each page's overview, showcase, and vs subpages

Search is debounced by 300ms and supports the current locale with en-US fallback. It filters the page tree of the current book, so it is disabled on a page outside every book.

## Branding Section

The menu reads its branding data from `docsector.config.js`:

- `branding.logo` — Project logo image
- `branding.name` — Project name text
- `branding.version` — Current version
- `branding.versions` — Version dropdown options, including optional release badges

The selector keeps current docs on unprefixed routes and switches archived versions to prefixed routes. For example, current `/guide/getting-started/overview/` can switch to archived `/v0.x/guide/getting-started/overview/` when a matching page exists under `src/pages/.old/v0.x/`.

Every version object shows a badge after the version label. Released versions default to `released`; versions with `released: false` or `status: 'draft'` default to `draft`; versions with `status: 'deprecated'` or `deprecated: true` default to `deprecated` in red. The badge can be customized with `badge: { label, color, textColor }`.

## Top Links

Under the branding, the menu lists Home, then **Changelog**, **Roadmap** and **Sponsor**, then the **Explore** list. Each link renders only when its `links` value is set — `null` hides it. The value decides how it opens:

| Value | Opens |
| --- | --- |
| A URL (`https://…`) | In a new tab, with the open-in-new icon |
| The path of a page of this site (`/sponsors/`) | In place, highlighted while that page is open |
| Any other path (`/feed.xml`, a file under `public/`) | In a new tab, with the open-in-new icon |

```js
links: {
  changelog: 'https://github.com/example/project/releases',
  sponsor: '/sponsors/',
  explore: [
    { label: 'Awesome list', url: 'https://github.com/example/awesome' }
  ]
}
```

For a page, prefer its bare path (`/sponsors/` rather than `/sponsors/overview/`): the link then stays highlighted on the page's showcase and vs tabs too. In `docsector dev`, a path that looks like a page but matches none prints a warning, and the link keeps opening in a new tab.

The usual in-place target is a page outside every book — see [Standalone Pages](/guide/pages-and-routing/overview/#standalone-pages).

## Footer Buttons

Website, Email, Chat, Discussions and GitHub are icon buttons under the menu. They open in a new tab; set a link to `null` to hide its button.

## Page Tree

The page tree is built from the router's routes at component creation time. Routes are filtered by active version and book, then grouped by their page basepath. Groups with a `menu.header` configuration get an expansion panel with a sticky header.

Pages with `menu.hidden` are left out. On a page outside every book the tree is empty: the menu shows its branding and top links, and the search, which only filters the tree, is disabled.

## Menu Item Grouping

Items are grouped when:

1. The first item in a basepath group has `meta.menu.header` defined
2. All subsequent items sharing the same basepath are collected into the same group

Items without a header are displayed as single entries.

## Auto-Scroll

On mount and after navigation, the menu automatically scrolls to the currently active item, centering it in the viewport with a smooth 300ms animation. When a top link and a page-tree item point to the same page, the tree item is the one centered.
