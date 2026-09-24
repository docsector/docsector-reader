---
faq:
  - q: Why does a page always show the same ad?
    a: |
      The creative is chosen from the page's path, so it never changes on reload
      and never flickers when the app loads; SSR builds also include it in the
      prerendered HTML. Different pages spread across your creatives. The ad stays
      out of the Markdown served to agents.
  - q: Does the ad load third-party scripts or track readers?
    a: No. It only shows the creatives you list in the config, with no scripts, cookies or tracking.
---

## Overview

Page Ad shows one of **your own creatives** above the content of every page: a small card with an image, a title, a short text and a link. Use it to promote a course, a book, a hosting partner or your sponsorship program.

It appears on every overview, showcase and vs page, and never on the home page. The feature is **opt-in**.

## Enable It

Add an `ads` block to `docsector.config.js`:

```js
ads: {
  enabled: true,
  items: [
    {
      href: 'https://example.com/course',
      image: '/images/promo/course.png',
      title: 'Official course',
      text: 'Learn it in a weekend, with hands-on projects.'
    }
  ]
}
```

## Several Creatives

List more items and each page shows one of them:

```js
ads: {
  enabled: true,
  items: [
    { href: 'https://example.com/course', title: 'Official course' },
    { href: 'https://example.com/book', title: 'The book', image: '/images/promo/book.png' }
  ]
}
```

The creative is chosen from the page's path. The same page always shows the same creative (SSR builds already carry it in the prerendered HTML), and different pages spread across the list. Adding or removing a creative reshuffles which page shows which.

## Localized Copy

`title` and `text` accept a plain string or one value per locale:

```js
ads: {
  enabled: true,
  items: [
    {
      href: 'https://example.com/course',
      title: { 'en-US': 'Official course', 'pt-BR': 'Curso oficial' },
      text: { 'en-US': 'Learn it in a weekend.', 'pt-BR': 'Aprenda em um fim de semana.' }
    }
  ]
}
```

## The Example Ad

With `enabled: true` and no creative yet, the page shows an example ad, **"Your ad here"**. It opens the same fallback link as the [Sponsors](/manual/basic/sponsors/overview/) example slots: `sponsors.fallbackUrl`, or `links.sponsor` when that is not set. A URL on another site opens in a new tab; a path of your site opens in the same tab. Without any fallback link, nothing shows.

## Creative Guidelines

- **Image**: 4:3, 256×192 recommended. It is shown at 128×96 (96×72 on phones) and cropped to fill the box.
- **Title**: one line.
- **Text**: up to two lines — about 100 characters on desktop, roughly half on phones. Longer text is cut with an ellipsis.
- The card has a fixed height, so the page never shifts, whatever the creative.
- Prefer neutral image paths such as `/images/promo/…`: ad blockers hide paths like `/ads/` or `banner`.

## Links

Creatives open in a new tab with `rel="sponsored noopener"`, as search engines ask for paid links. The example ad points to your own sponsor page: a URL on another site opens in a new tab with `rel="noopener"`, and a path of your site opens in the same tab.

## Build Warnings

`docsector build` and `docsector dev` check the block and print one warning per problem:

| Warning | What happens | Fix |
|---------|--------------|-----|
| `ads must be an object` / `ads.enabled must be the boolean true` | The ad stays off | Write `ads: { enabled: true, … }` |
| `ads.items[…] needs an absolute http(s) href` | The creative is skipped | Link it with a full `https://` URL |
| `ads.items[…] needs a title` | The creative is skipped | Add a `title` string or locale map |
| `ads.items[…] has an invalid text` / `… invalid image` | Only that field is dropped | Fix or remove the field |
| `ads is enabled but has no valid creative and no sponsors fallback URL` | No ad shows | Add a creative, or set `sponsors.fallbackUrl` or `links.sponsor` |

## Wording

Override these keys in your language files:

```hjson
page: {
  ad: {
    label: 'Sponsored'
    example: 'Advertise here'
  }
}
```

## Reference

### Configuration

```js
ads: {
  enabled: false,
  items: []
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | Only the boolean `true` enables the ad. |
| `items` | `[]` | Your creatives. |

### Creative

| Key | Description |
|-----|-------------|
| `href` | Absolute `http(s)` URL. |
| `title` | A string or a locale map. Required. |
| `text` | Optional; a string or a locale map. |
| `image` | Optional image path under `public/`, or a full URL. |

An invalid `href` or `title` skips the creative with a build warning; an invalid `text` or `image` drops only that field.

### Language keys

| Key | English | Português |
|-----|---------|-----------|
| `page.ad.label` | Ad | Anúncio |
| `page.ad.example` | Your ad here | Seu anúncio aqui |
| `system.support` | Sponsor this project | Patrocine este projeto |
