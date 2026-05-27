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

## Notes

- A version entry may also point to an external URL.
- Keep labels short so the dropdown stays easy to scan.