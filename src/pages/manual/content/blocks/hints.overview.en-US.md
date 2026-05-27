## Overview

Hints are GitHub-style alert blocks rendered from Markdown blockquotes with a `[!TYPE]` marker.

Use them when the content should be read as a note, tip, warning, or other semantic callout.

For neutral quoted text without alert styling, see [Quote](/manual/content/blocks/quotes/overview/).

## Markdown Syntax

```markdown
> [!WARNING]
> This operation may interrupt workers.
```

## Supported Markers

| Marker | When to use |
|--------|-------------|
| `NOTE` | Extra context or background |
| `TIP` | Practical advice or best practice |
| `IMPORTANT` | Critical information that must be noticed |
| `WARNING` | Pitfalls, risky actions, or breaking changes |
| `CAUTION` | High-risk actions that deserve extra care |

## Notes

- The marker should appear on the first line of the blockquote.
- Hint bodies can still contain paragraphs, lists, code blocks, and math.
- Unknown markers fall back to a regular quote.
