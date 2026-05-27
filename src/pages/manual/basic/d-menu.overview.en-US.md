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
- **External links** — GitHub, discussions, chat, email, changelog, roadmap, sponsor
- **Explore section** — Custom external links
- **Page tree** — Auto-generated from the page registry with expansion panels

## Search

The search input at the top of the menu filters pages by matching the search term against:

1. **Tags** — Defined per page in `src/pages/*.index.js` under `metadata.tags`
2. **Page content** — The Markdown source of each page's overview, showcase, and vs subpages

Search is debounced by 300ms and supports the current locale with en-US fallback.

## Branding Section

The menu reads its branding data from `docsector.config.js`:

- `branding.logo` — Project logo image
- `branding.name` — Project name text
- `branding.version` — Current version
- `branding.versions` — Version dropdown options, including optional release badges

The selector keeps current docs on unprefixed routes and switches archived versions to prefixed routes. For example, current `/guide/getting-started/overview/` can switch to archived `/v0.x/guide/getting-started/overview/` when a matching page exists under `src/pages/.old/v0.x/`.

Every version object shows a badge after the version label. Released versions default to `released`; versions with `released: false` or `status: 'draft'` default to `draft`; versions with `status: 'deprecated'` or `deprecated: true` default to `deprecated` in red. The badge can be customized with `badge: { label, color, textColor }`.

## External Links

Each link is conditionally rendered — set to `null` in the config to hide:

- **GitHub** — Repository link
- **Discussions** — GitHub Discussions
- **Chat** — Discord/Slack/etc.
- **Email** — Opens mailto link
- **Changelog** — External or internal page
- **Roadmap** — Project roadmap
- **Sponsor** — Sponsorship page
- **Explore** — Array of custom external links

## Page Tree

The page tree is built from the router's routes at component creation time. Routes are filtered by active version and book, then grouped by their page basepath. Groups with a `menu.header` configuration get an expansion panel with a sticky header.

## Menu Item Grouping

Items are grouped when:

1. The first item in a basepath group has `meta.menu.header` defined
2. All subsequent items sharing the same basepath are collected into the same group

Items without a header are displayed as standalone entries.

## Auto-Scroll

On mount and after navigation, the menu automatically scrolls to the currently active item, centering it in the viewport with a smooth 300ms animation.
