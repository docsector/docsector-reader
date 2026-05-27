## Overview

Translation Progress shows how complete the current locale is and how many translations are available for the page.

It helps readers and maintainers understand whether a page is fully localized or still in progress.

## Visible Signals

- A progress chip for the active locale
- A chip showing how many locales are available compared to the configured total

## Data Source

The progress view relies on translation metadata such as `_sections.done` and `_sections.count`.

## Notes

- This information appears in the page footer area.
- Translation progress is more useful when section metadata is kept accurate.