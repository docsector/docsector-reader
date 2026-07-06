## Overview

The footer shows a "Powered by Docsector" credit at the bottom of every page.

Above that credit, you can optionally show a row of legal / compliance links — Privacy, Cookies, Trademark, Security, License, and anything else your project needs.

The row is **opt-in**: it only appears when you configure at least one link.

## Adding Legal Links

Add a `footer.legalLinks` array to `docsector.config.js`:

```js
footer: {
  legalLinks: [
    { href: 'https://example.com/legal/privacy', label: 'Privacy' },
    { href: 'https://example.com/legal/cookies', label: 'Cookies' },
    { href: 'https://example.com/legal/license', label: 'License' }
  ]
}
```

Each link renders in a centered row directly above the "Powered by" line, separated by dots, and wraps to multiple lines on narrow screens.

## Localized Labels

A `label` can be a plain string or a locale map resolved to the reader's current language:

```js
footer: {
  legalLinks: [
    { href: 'https://example.com/legal/privacy', label: { 'en-US': 'Privacy', 'pt-BR': 'Privacidade' } },
    { href: 'https://example.com/legal/security', label: { 'en-US': 'Security', 'pt-BR': 'Segurança' } }
  ]
}
```

When the active language is missing from the map, the label falls back to `*`, then `en-US`, then the first value.

## What Readers Notice

- Quick access to Privacy, Cookies, and other compliance pages
- The links sit on their own line, just above the Docsector credit
- Labels follow the reader's current language

## Notes

- Leave `legalLinks` empty (or omit `footer`) to hide the row entirely.
- Absolute `http(s)` URLs open in a new tab automatically; set `external: true` to force a new tab for any other `href`.
- Keep labels short — long labels make the row wrap sooner on mobile.

## Reference

```js
footer: {
  legalLinks: Array<{ href: string, label?: string | Record<string, string>, external?: boolean }>
}
```

The single footer feature configuration.

- `footer.legalLinks` — array of legal links. Empty or absent hides the row.
- `href` — link target (absolute URL recommended for external policies).
- `label` — display text: a string, or a `{ locale: text }` map. Defaults to the `href` when omitted.
- `external` — force opening in a new tab. Inferred as `true` for `http(s)` URLs.
