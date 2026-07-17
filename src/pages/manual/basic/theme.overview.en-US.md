## Overview

Every Docsector site offers three theme modes in the Settings dialog: **Auto**, **Light** and **Dark**.

**Auto is the default.** A reader whose operating system is set to dark mode opens the documentation in dark mode — no click required — and a reader on a light system gets the light theme. Light and Dark are explicit overrides for readers who want a theme regardless of their system.

It works out of the box. There is **no configuration key** — Auto is always the engine default.

## What Readers Notice

- The site matches their system colours the first time they open it
- Flipping the OS theme flips the site **live**, without a reload
- Picking Light or Dark in the Settings dialog overrides the system for good
- No flash of the wrong theme while the page loads

## How the Theme Is Resolved

The choice is stored in `localStorage` under `setting.theme`, with one of three values:

```text :toolbar="true";
auto | light | dark
```

`auto` resolves through the `prefers-color-scheme` media query, and the site keeps listening to it, so a reader who flips their OS theme sees the docs follow along immediately. `light` and `dark` pin the theme and ignore the system.

## Why There Is No Flash

A tiny script runs at the top of the page — before the application bundle loads — reads the stored preference (or the system colour scheme) and applies the theme to the page. By the time the browser paints for the first time, the correct theme is already in place.

The application then applies the same preference before Quasar's Dark plugin can fall back to the system value, so the theme never changes between the first paint and the mounted page.

## Migrating from an Earlier Version

Before v4.16.0 the theme was a boolean stored under `setting.background`. Readers keep their choice:

- Stored **dark** — kept as `dark`. It could only have come from an explicit click.
- Stored **light** — becomes `auto`. Older versions wrote that value automatically on every reader's first visit, so it cannot be told apart from "never chose a theme". A reader who deliberately picked Light on a dark system will see the site follow their system once; picking Light again stores it explicitly and it sticks forever.

The old key is left untouched, and the new value is written the first time a reader loads v4.16.0 or later.

## Changing the Wording

The Settings labels come from the `settings.appearance.theme` i18n keys. Override them in your own language files:

```text
settings: {
  appearance: {
    theme: {
      _: 'Colour Scheme',
      auto: 'System',
      light: 'Day',
      dark: 'Night'
    }
  }
}
```

## Notes

- Theme-aware components read Quasar's `body--light` / `body--dark` body classes — see the [Theming guide](/theming) for the CSS side.
- Terminal blocks keep a dark canvas in both themes, the way a real terminal looks.
- Markdown images written with `<picture>` and `media="(prefers-color-scheme: dark)"` follow the **operating system**, not the site theme. In Auto mode the two always agree; they can diverge for a reader who pins the opposite theme.
