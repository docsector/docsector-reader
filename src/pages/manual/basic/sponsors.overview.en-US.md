---
faq:
  - q: Why don't my sponsors show when the assistant is open?
    a: |
      Sponsors live in the Table of Contents column and follow it. On desktops
      too narrow for the content, the Table of Contents and the assistant together,
      the assistant takes the column's place, and the sponsors go with it.
  - q: Can a sponsor get a normal (dofollow) link?
    a: No. Sponsor links are paid placements and always carry `rel="sponsored noopener"`, as search engines ask for paid links.
  - q: How do I add a third tier?
    a: Add another `{ id, layout }` entry to `tiers`. Tiers render in the order you list them, and each one picks the `wide` or `square` layout.
---

## Overview

Sponsors adds your project's sponsor logos under the Table of Contents, in the same column. Tiers go from the highest down: the top tier shows one **wide** logo per row, the next tier shows **square** logos two per row.

Every tier that has no sponsor yet shows a **"Your sponsor here"** example slot, and the panel always ends with a dashed **"Your logo here"** button. Both open your sponsorship page, so it is easy for new sponsors to find you.

The feature is **opt-in**.

## Enable It

Add a `sponsors` block to `docsector.config.js`:

```js
links: {
  sponsor: 'https://github.com/sponsors/your-org'
},

sponsors: {
  enabled: true,
  tiers: [
    { id: 'platinum', layout: 'wide' },
    { id: 'gold', layout: 'square' }
  ],
  items: [
    { name: 'Acme', tier: 'platinum', href: 'https://acme.example', logo: '/images/sponsors/acme.svg' },
    { name: 'Globex', tier: 'gold', href: 'https://globex.example', logo: '/images/sponsors/globex.png' }
  ]
}
```

Put the logo files under `public/images/sponsors/`.

## Tiers and Layouts

List the tiers highest first. Each sponsor names its tier by `id`.

| Layout | Per row | Box | Recommended logo |
|--------|---------|-----|------------------|
| `wide` | 1 | 3:1 | 600×200 |
| `square` | 2 | 1:1 | 300×300 |

Use an SVG, or a transparent PNG with some padding inside the image. The logo is fitted inside its box without cropping, and the box size never depends on the image, so the page does not shift while logos load.

## Dark-Theme Logos

Add `logoDark` when a logo needs a different version on the dark theme:

```js
{ name: 'Acme', tier: 'platinum', href: 'https://acme.example', logo: '/images/sponsors/acme.svg', logoDark: '/images/sponsors/acme-dark.svg' }
```

The swap happens in CSS, so the browser only downloads the version it shows. Without `logoDark`, the logo sits on a light plate on the dark theme, so dark artwork stays readable.

## Example Slots and the "Your Logo Here" Button

Both the example slots and the button open the **fallback link**:

- `sponsors.fallbackUrl` when you set it;
- otherwise `links.sponsor`, the same link the menu's Sponsor button uses.

```js
sponsors: {
  enabled: true,
  fallbackUrl: '/guide/sponsoring/overview/',
  tiers: [{ id: 'platinum', layout: 'wide' }, { id: 'gold', layout: 'square' }],
  items: []
}
```

With no sponsor at all, the panel shows one example slot per tier and the button. A link to another site opens in a new tab; a path of your site opens in the same tab. Without any fallback link, the empty tiers and the button are hidden.

## Where It Shows and When It Hides

Sponsors follow the Table of Contents:

| Where | Behavior |
|-------|----------|
| Desktop | Under the tree, in the right column |
| Tablet (768–1023px) | In the Table of Contents drawer, over the content |
| Phone (under 768px) | Under the tree, in the Table of Contents dialog |
| Home page | When its layout shows the Table of Contents |

They hide whenever the Table of Contents hides: the reader's Table of Contents toggle, pages or books with `toc: false`, the `fullwidth` layout, and desktops where the assistant takes the column.

## Links

Sponsor logos open in a new tab with `rel="sponsored noopener"`. The example slots and the button point to your own sponsor page: a URL on another site opens in a new tab with `rel="noopener"`, and a path of your site opens in the same tab.

## Build Warnings

`docsector build` and `docsector dev` check the block and print one warning per problem; the rest keeps working. The table says what happens:

| Warning | What happens | Fix |
|---------|--------------|-----|
| `sponsors must be an object` | The panel stays off | Write `sponsors: { … }` |
| `sponsors.enabled must be the boolean true` | The panel stays off | Write `enabled: true`, not `'true'` or `1` |
| `sponsors.tiers must list at least one { id, layout } tier` | Only the button shows | Declare your tiers |
| `… needs a non-empty string id` / `… repeats the id …` | The tier is skipped | Give each tier a unique id |
| `… has an unknown layout …` | The tier uses `square` | Use `wide` or `square` |
| `… names an undeclared tier …` | The sponsor is skipped | Use one of the declared tier ids |
| `… needs an absolute http(s) href` | The sponsor is skipped | Link the sponsor with a full `https://` URL |
| `… needs a name` / `… needs a logo` | The sponsor is skipped | Fill in the missing field |
| `… has an invalid logoDark` | The light logo is used on both themes | Use a logo path or URL |
| `sponsors.fallbackUrl must be an http(s) URL or a root-relative path` | `links.sponsor` is used instead | Use `https://…` or `/path` |
| `links.sponsor must be … — not used as the sponsors fallback` | No fallback link (the menu link is unchanged) | Use `https://…` or `/path` |
| `sponsors is enabled but has nothing to show` | The panel stays hidden | Add a sponsor, or set `sponsors.fallbackUrl` or `links.sponsor` |

## Wording

Override these keys in your language files to change the texts:

```hjson
page: {
  sponsors: {
    title: 'Our sponsors'
    cta: 'Become a sponsor'
  }
}
```

## Reference

### Configuration

```js
sponsors: {
  enabled: false,
  fallbackUrl: null,
  tiers: [],
  items: []
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | Only the boolean `true` enables the panel. |
| `fallbackUrl` | `null` | Link of the example slots, the button and the [example ad](/manual/basic/page-ad/overview/). Falls back to `links.sponsor`. |
| `tiers` | `[]` | Tiers, highest first. Required when enabled. |
| `items` | `[]` | The sponsors. |

### Tier

| Key | Description |
|-----|-------------|
| `id` | Unique name the sponsors refer to. |
| `layout` | `wide` or `square`. An unknown layout falls back to `square`. |

### Sponsor

| Key | Description |
|-----|-------------|
| `name` | Sponsor name, used as the logo's alternative text. |
| `tier` | The `id` of its tier. |
| `href` | Absolute `http(s)` URL. |
| `logo` | Logo path under `public/`, or a full URL. |
| `logoDark` | Optional dark-theme logo. |

### Language keys

| Key | English | Português |
|-----|---------|-----------|
| `page.sponsors.title` | Sponsors | Patrocinadores |
| `page.sponsors.cta` | Your logo here | Sua logo aqui |
| `page.sponsors.example` | Your sponsor here | Seu patrocinador aqui |
| `system.support` | Sponsor this project | Patrocine este projeto |
