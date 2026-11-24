## Overview

Version Switcher lets readers move between the current documentation and archived or alternative versions.

It helps keep long-lived docs usable when the project supports more than one release line.

## How It Works

- The selector reads the configured versions list.
- Current docs usually stay on unprefixed routes.
- Archived versions can use a route prefix such as `/v0.x`.
- When possible, the switcher tries to open the equivalent page in the target version.
- If the same page does not exist there, it falls back to the first matching route in that book.

## Release Badges

The selector can show badges such as:

- `released`
- `draft`
- `deprecated`

Custom badge labels and colors can also be configured per version.

## Versions in Development

A release newer than the latest released version that the current docs already name — as the `version` that ships a page or as one of its `updated` releases — joins the selector on its own, above the configured versions, with a blue **in development** badge. Only pages of the current docs count, never an archived or preview version's, nor a `draft` or `empty` page. Choosing it opens the current docs, which already describe what is coming; from the current docs it keeps you where you are. A configured entry of the same release — `v1.4.0-dev` for v1.4.0 — takes its place. It leaves the selector once a configured entry lists it, and once it is released it is simply no longer newer than the latest release. See Version chips in Pages and Routing.

## Notes

- A version entry may also point to an external URL.
- Keep labels short so the dropdown stays easy to scan.