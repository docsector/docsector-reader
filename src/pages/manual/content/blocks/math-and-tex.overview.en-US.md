## Overview

Math and TeX support lets you write inline equations and display formulas directly in Markdown using KaTeX-compatible syntax.

## Inline Math

Use single dollar delimiters inside normal text:

```markdown
Use $E = mc^2$ inside a sentence.
```

## Display Math

Use double dollar delimiters for standalone formulas:

```markdown
$$
\int_0^1 x^2 dx
$$
```

## Notes

- Math works in paragraphs, hints, and expandable blocks.
- Delimiters remain literal inside inline code and fenced code blocks.
- Use display math when the formula needs its own visual space.