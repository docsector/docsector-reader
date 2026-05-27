## Overview

Expandable blocks collapse secondary content behind a clickable title.

They are a good fit when the main section should stay short, but readers may still need optional details, checklists, appendix material, or longer examples.

The block is authored with the custom Markdown element `<d-expandable>`.

## HTML Example

The custom element can be authored directly in page Markdown:

````html
<d-expandable title="Why hide this content?">

Use expandable blocks when the main section should stay concise but readers may still need more detail.

</d-expandable>

### Open by Default

<d-expandable title="Release checklist" open="true">

- Review breaking changes
- Update screenshots
- Run smoke tests

</d-expandable>

### Rich Content

<d-expandable title="Deployment appendix">

> [!TIP]
> Keep the primary flow in the main section and move optional details here.

```bash
npm install
npm run build
```

</d-expandable>
````

## Notes

- Use `open="true"` when the section should start expanded.
- Keep page headings outside the expandable block. Headings inside the body are flattened to regular paragraphs so the page ToC stays stable.
- Avoid nesting one `<d-expandable>` inside another in this first version.