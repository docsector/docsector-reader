---
faq:
  - q: Why don't the sublinks show up in the page source?
    a: |
      Dropdown menus render only when they open, so their links are not part of the
      prerendered HTML. The pages they point to are still in the sitemap, `llms.txt`
      and the search index — only the menu itself is built in the browser.
  - q: Why does a link to `/guide/` open in a new tab?
    a: |
      A book has no page of its own at its root: `/guide/` matches no page, so it is
      treated like a static file. Link a real page instead, such as
      `/guide/getting-started/`.
---

## Overview

Header Links adds your own navigation to the main header: a few links **centered** in the top bar, with **icons** and **dropdowns**. Use them for the places readers should always reach in one click — your website, a sponsors page, a blog, the other docs sets.

Where the header has no room for them — on phones, or next to the sidebar on smaller desktops — the links move into a menu that opens from an arrow **attached to the brand**, so the header never gets crowded.

The feature is **opt-in**.

## Enable It

Add a `header` block to `docsector.config.js`:

```js
header: {
  links: [
    { label: 'Website', href: 'https://example.com' },
    { label: 'Getting started', href: '/guide/getting-started/' }
  ]
}
```

## Icons

Give a link an `icon` with a [Material icon](https://fonts.google.com/icons) name:

```js
{ label: 'Sponsors', icon: 'favorite', href: '/sponsors/' }
```

The build bundles only the icons your config uses.

## Dropdowns

A link with `children` becomes a dropdown. Sublinks take a `label`, an optional `icon` and an `href`:

```js
header: {
  links: [
    { label: 'Ecosystem', icon: 'hub', children: [
      { label: 'Benchmarks', icon: 'speed', href: 'https://example.com/benchmarks' },
      { label: 'Plugins', href: '/guide/plugins/' }
    ] }
  ]
}
```

There is one level of sublinks. A dropdown's own `href` is ignored — it only opens its menu.

## Where Links Open

A link opens like the [top links of the sidebar](/manual/basic/d-menu/overview/#top-links):

| `href` | Opens |
| --- | --- |
| A URL (`https://…`) | In a new tab |
| The path of a page of this site (`/sponsors/`) | In place |
| Any other path (`/feed.xml`, a file under `public/`) | In a new tab |

In the menus — a dropdown, or the arrow's menu — a link that opens in a new tab shows the open-in-new icon. The centered links leave it out to keep the header clean; screen readers still announce the new tab.

Point to a page, not to a book root: `/guide/getting-started/`, not `/guide/`.

## Highlight

A link to a page of the site is highlighted while that page is open. Link the bare page path (`/sponsors/` rather than `/sponsors/overview/`) to keep it highlighted on the page's showcase and vs tabs too. A dropdown is highlighted when one of its sublinks is.

## When There Is No Room

The centered links show only where they fit. From the labels and icons in your config, Docsector estimates how wide the links are, and shows them once the header has that much free space — the sidebar and the assistant panel count against it, the screen width alone does not decide. Links never wrap and are never cut off.

Where they don't fit, an arrow appears right after the brand instead. It opens a menu with every link; a dropdown shows as a small section with its sublinks. The brand itself still goes to the home page. On phones the arrow is always used; next to the sidebar, three short links show from about 1200px wide screens, a longer list from wider ones.

When the links do show, they stay centered and the brand name is shortened first, down to its logo. Keep labels short, and use a dropdown when the list grows.

In the menus, the arrow keys move between links, Home and End jump to the first and last one, and Esc closes the menu.

## Build Warnings

`docsector build` and `docsector dev` check the block and print one warning per problem:

| Warning | What happens | Fix |
| --- | --- | --- |
| `header must be an object` / `header.links must be an array` | No header links | Write `header: { links: [ … ] }` |
| `… needs a label (a string or a locale map)` | The link is skipped | Add a `label` |
| `… needs an href or children` | The link is skipped | Add an `href` — written `href`, not `url` — or `children` |
| `… has an invalid icon` | The link shows without an icon | Use a Material icon name |
| `… children must be an array` | The link is treated as a plain link | Write `children: [ … ]` |
| `… has children — its href is ignored` | The dropdown only opens its menu | Remove the `href`, or move it into a sublink |
| `… has children — only one level of sublinks is shown` | The deeper links are dropped | Flatten them into the dropdown |
| `… has no valid sublinks` | The dropdown is skipped | Fix its sublinks |

## Wording

The navigation and the arrow are named by the `header.links` key, and screen readers announce `header.newTab` after a link that opens in a new tab. Override them in your language files:

```hjson
header: {
  links: 'Project links'
  newTab: 'new tab'
}
```

## Reference

### Configuration

```js
header: {
  links: []
}
```

| Key | Default | Description |
| --- | --- | --- |
| `links` | `[]` | The header links, in display order. |

### Link

| Key | Description |
| --- | --- |
| `label` | A string or a locale map (`&#123; 'en-US': 'Blog', 'pt-BR': 'Blog' &#125;`). Required. |
| `icon` | Optional Material icon name. |
| `href` | A URL, or the path of a page of this site. Required unless the link has `children`. |
| `children` | Optional sublinks, each with `label`, `icon` and `href`. |

### Language keys

| Key | English | Português |
| --- | --- | --- |
| `header.links` | Site links | Links do site |
| `header.newTab` | opens in a new tab | abre em nova aba |
