## Overview

Tables are useful for comparisons, option matrices, compatibility notes, and any content that benefits from a row-and-column layout.

## Markdown Syntax

```markdown
| Feature | Status | Notes |
|---------|--------|-------|
| Search | Done | Available in the sidebar |
| Math | Done | Rendered with KaTeX |
| Mermaid | Done | Theme-aware diagrams |
```

## Alignment

Colons in the separator row align a column: `:---` left, `:---:` center, `---:` right. A column without colons keeps the default left alignment.

```markdown
| Plan | Price | Change |
|:--------|------:|:------:|
| Starter | 1,200 | +9.9% |
```

## Wide Tables

A table wider than the page scrolls sideways inside its own box instead of stretching the page — also inside a hint (`> [!NOTE]`) or a list item.

## Notes

- Keep column labels short and clear.
- Use tables when scanning is more important than narrative flow.
- If the content becomes too dense, split it into multiple smaller tables.
