## Overview

`DMenu` is the **left sidebar navigation** component. It renders the project branding, external links, search functionality, and the documentation page tree.

## Features

- **Search** — Filter pages by searching content, titles, and tags
- **Branding section** — Logo, project name, version selector
- **External links** — GitHub, discussions, chat, email, changelog, roadmap, sponsor
- **Explore section** — Custom external links
- **Page tree** — Auto-generated from the page registry with expansion panels

## Search

The search input at the top of the menu filters pages by matching the search term against:

1. **Tags** — Defined in `src/i18n/tags.hjson`
2. **Page content** — The Markdown source of each page's overview, showcase, and vs subpages

Search is debounced by 300ms and supports the current locale with en-US fallback.

## Branding Section

Reads from `docsector.config.js`:

- `branding.logo` — Project logo image
- `branding.name` — Project name text
- `branding.version` — Current version
- `branding.versions` — Version dropdown options

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

The page tree is built from the router's routes at component creation time. Routes are grouped by their basepath (second URL segment). Groups with a `menu.header` configuration get an expansion panel with a sticky header.

## Menu Item Grouping

Items are grouped when:

1. The first item in a basepath group has `meta.menu.header` defined
2. All subsequent items sharing the same basepath are collected into the same group

Items without a header are displayed as standalone entries.

## Auto-Scroll

On mount and after navigation, DMenu automatically scrolls to the currently active menu item, centering it in the viewport with a smooth 300ms animation.
