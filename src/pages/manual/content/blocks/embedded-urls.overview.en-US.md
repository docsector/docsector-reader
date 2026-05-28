## Overview

Embedded URLs turn supported public links into responsive embeds directly inside Markdown pages.

This block is a higher-level alternative to raw iframe markup when the source is a supported provider and the page should keep a consistent card + preview treatment.

## Markdown Syntax

```html
<d-block-embedded-url url="https://www.youtube.com/watch?v=M7lc1UVf-VE" title="YouTube player demo">
Optional caption rendered as inline Markdown.
</d-block-embedded-url>
```

You can also omit the caption body when the provider preview already gives enough context:

```html
<d-block-embedded-url url="https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P" />
```

## Supported Providers

- YouTube
- Vimeo
- Spotify
- CodePen

## Notes

- `url` is required. `title` is optional.
- The block preserves the original query string, so provider options such as `autoplay=1&loop=1` continue to work when the provider supports them.
- Unsupported or private URLs fall back to a safe external-link card instead of attempting a generic iframe.
- Use Raw HTML when you need a provider outside the curated list or when you need full manual iframe control.