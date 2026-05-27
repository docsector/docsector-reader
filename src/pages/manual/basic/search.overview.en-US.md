## Overview

Search helps readers find documentation pages quickly from the left sidebar.

Under the hood, this experience is powered by the menu search flow used by `DMenu`.

## What Search Looks At

- Page titles and localized labels
- `metadata.tags` defined in `src/pages/*.index.js`
- Markdown content from overview, showcase, and vs pages

## Behavior

- Search starts when the query has more than one character.
- Results follow the active documentation version and current book.
- The current locale is preferred, with `en-US` as fallback when needed.
- Input is debounced so fast typing does not rebuild results on every keystroke.

## Good Practices

- Keep page titles descriptive.
- Add useful search tags close to the page entry in the registry.
- Prefer short, concrete wording so readers can guess the right term easily.