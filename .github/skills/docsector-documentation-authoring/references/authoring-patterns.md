# Docsector Authoring Patterns

Use these patterns to choose a page shape before writing detailed content.

## Tutorial or Setup Guide

Use when readers must follow a sequence.

Recommended blocks:

- Headings for major phases.
- Stepper for guided, interactive sequences.
- Code blocks for commands and configuration.
- Hints for warnings or best practices.
- Files for downloadable checklists or templates.

Start with a short outcome statement, then move into steps. Keep each step focused on one action and one result.

## Concept or Overview Page

Use when readers need understanding before action.

Recommended blocks:

- Paragraphs for explanation.
- Headings for scannable sections.
- Unordered lists for capabilities and constraints.
- Images or Mermaid diagrams for mental models.
- Quick Links or Cards for next steps.

Avoid heavy custom blocks if a simple section and list are clearer.

## Navigation Hub

Use when a page primarily routes readers to other content.

Recommended blocks:

- Quick Links for compact next steps.
- Cards for visual destinations.
- Short paragraphs for framing.
- Headings only when the hub has multiple groups.

Use `to` for Docsector routes and `href` for external URLs.

## Changelog or Release Notes

Use when content is chronological.

Recommended blocks:

- Timeline for dated entries.
- Timeline tags for release channels, categories, or status.
- Hints for breaking changes or migration warnings.
- Code blocks for commands that users must run.
- Quick Links for related upgrade docs.

Give timeline items stable `anchor` values for important releases and migration entries.

## API Reference Page

Use when structured API data is available.

Recommended blocks:

- API Reference for Quasar-compatible JSON.
- Code blocks for quick usage examples.
- Hints for compatibility or deprecation notes.
- Tables only for small summaries not already covered by the API block.

Keep JSON assets under same-origin public paths such as `/api/manual/...` or `/quasar-api/...`.

## Example Showcase

Use when readers need to inspect behavior and source.

Recommended blocks:

- Code Examples for live Vue SFC previews.
- Code blocks for smaller standalone snippets.
- Expandable for optional implementation notes.
- Cards or Quick Links for related examples.

Use `expanded="true"` when source inspection is the main value. Set `codepen="false"` when an example cannot be exported safely.

## Troubleshooting Page

Use when readers need to diagnose and resolve problems.

Recommended blocks:

- Headings for symptoms or error messages.
- Hints for warnings and high-risk operations.
- Ordered lists for resolution steps.
- Code blocks for commands and logs.
- Expandable for verbose logs or advanced diagnostics.

Keep the shortest successful path visible and move rare details into Expandable blocks.
