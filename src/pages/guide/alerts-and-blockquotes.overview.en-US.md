# Alerts and Blockquotes

Docsector supports GitHub-style alert blockquotes and regular blockquotes.

## GitHub alert syntax

Use this syntax in Markdown:

```markdown
> [!CAUTION]
> NOTICE OF BREAKING CHANGE.
>
> As of 7.0.0, multiple breaking changes were introduced.
```

Supported alert types:

- `NOTE`
- `TIP`
- `IMPORTANT`
- `WARNING`
- `CAUTION`

## Alert examples

### Note

> [!NOTE]
> This is extra context that helps readers understand the current section.

### Tip

> [!TIP]
> You can keep your examples short and focused to improve readability.

### Important

> [!IMPORTANT]
> This migration changes defaults and must be reviewed before deployment.

### Warning

> [!WARNING]
> This action may interrupt running workers in production.

### Caution

> [!CAUTION]
> Back up your environment before applying this update.
>
> See `docs/migration.md` for the complete checklist.

## Regular blockquote

If no `[!TYPE]` marker is present, blockquotes render as regular notes:

> This is a regular blockquote.
>
> It still supports **bold text**, [links](https://github.com/docsector/docsector-reader), and `inline code`.

## Notes

- Alert markers are case-insensitive (`[!note]` also works).
- Unknown markers are treated as regular blockquotes.
- Alert and regular blockquotes both work in light and dark mode.
