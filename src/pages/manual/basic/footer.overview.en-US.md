## Overview

The footer shows a "Powered by Docsector" credit at the bottom of every page.

Above that credit, you can optionally show a row of legal / compliance links — Privacy, Cookies, Trademark, Security, License, and anything else your project needs. Below it, you can optionally show your project's copyright notice.

Both are **opt-in**: they only appear when you configure them.

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

## Adding a Copyright Notice

Add a `footer.copyright` string to `docsector.config.js` and it renders on its own line, directly below the "Powered by" credit:

```js
footer: {
  copyright: 'Copyright (c) 2023-present Example Corp. and contributors'
}
```

The text is rendered exactly as written — Docsector does not prepend a `©` symbol or substitute the current year, so what you configure is what readers see.

Like link labels, the value can also be a locale map:

```js
footer: {
  copyright: {
    'en-US': '© 2023-present Example Corp. All rights reserved.',
    'pt-BR': '© 2023-presente Example Corp. Todos os direitos reservados.'
  }
}
```

## What Readers Notice

- Quick access to Privacy, Cookies, and other compliance pages
- The links sit on their own line, just above the Docsector credit
- The copyright notice sits on its own line, just below the Docsector credit
- Labels and the copyright follow the reader's current language
- Hovering the Docsector button reveals the engine version and the deploy build — handy for confirming which build is actually live when tracing a deploy issue

## Notes

- Leave `legalLinks` empty (or omit `footer`) to hide the row entirely; omit `copyright` to hide the copyright line.
- Absolute `http(s)` URLs open in a new tab automatically; set `external: true` to force a new tab for any other `href`.
- Keep labels short — long labels make the row wrap sooner on mobile.
- The version tooltip shows the Docsector Reader version that built the site plus the build ID (the deploy's commit SHA on Cloudflare Pages, shown git-style short). It needs no configuration.

## Reference

```js
footer: {
  legalLinks: Array<{ href: string, label?: string | Record<string, string>, external?: boolean }>,
  copyright: string | Record<string, string>
}
```

The footer feature configuration.

- `footer.legalLinks` — array of legal links. Empty or absent hides the row.
- `href` — link target (absolute URL recommended for external policies).
- `label` — display text: a string, or a `{ locale: text }` map. Defaults to the `href` when omitted.
- `external` — force opening in a new tab. Inferred as `true` for `http(s)` URLs.
- `footer.copyright` — copyright notice below the "Powered by" credit: a string, or a `{ locale: text }` map (same fallback order as labels). Absent hides the line. Requires Docsector Reader 4.23.0 or newer.
