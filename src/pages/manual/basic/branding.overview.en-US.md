## Overview

Branding controls the visual identity and quick-access links shown at the top of the documentation menu.

It covers the project logo, name, current version label, and the external links that appear below the branding block.

## Main Configuration

Branding data comes from `docsector.config.js`:

- `branding.logo`
- `branding.name`
- `branding.version`
- `links.github`, `links.discussions`, `links.chat`, `links.email`
- `links.changelog`, `links.roadmap`, `links.sponsor`, `links.explore`

## The Brand Lockup

The header and the menu do not show `branding.name` on its own — they render it as a lockup with the word *Documentation*, so a reader always knows which docs set they are in.

The wording lives in the `system.brand` i18n key, where `{name}` is replaced by `branding.name`. Each locale owns the whole phrase, including the word order:

```text
en-US:  '{name} Documentation'   →  Bootgly Documentation
pt-BR:  'Documentação {name}'    →  Documentação Bootgly
```

To change it, override `system.brand` in your own language files:

```text
system: {
  brand: '{name} Official Documentation'
}
```

## What Readers Notice

- A recognizable project identity in the menu
- Faster access to repository and community links
- A stable place to understand which docs set they are reading

## Notes

- Set a link to `null` to hide it from the menu.
- A square or near-square logo usually fits best in the sidebar.
- Keep the visible project name short enough to scan quickly.