## Overview

Timeline blocks render chronological updates inside Markdown, making them a good fit for changelogs, release notes, migration logs, and rollout journals.

Each item requires a date, can expose optional tags, supports a stable hash anchor, and renders rich body content inside the entry.

The block is authored with the custom Markdown elements `<d-block-timeline>`, `<d-block-timeline-item>`, and optional `<d-block-timeline-tag>` children.

## HTML Example

````html
<d-block-timeline>
  <d-block-timeline-item date="2025-12-25" anchor="brand-new-update">

<d-block-timeline-tag color="warning" icon="rocket_launch">beta</d-block-timeline-tag>
<d-block-timeline-tag color="secondary" text-color="white">docs</d-block-timeline-tag>

## A brand new update

Use this block for release notes, product announcements, migration notices, or operational updates.

<d-block-quick-links title="Related links">
  <d-block-quick-link title="Install" description="Set up the project" to="/guide/getting-started" />
</d-block-quick-links>

  </d-block-timeline-item>

  <d-block-timeline-item date="2026-01-10">

## General availability

This second entry gets its own generated anchor even when dates repeat.

  </d-block-timeline-item>
</d-block-timeline>
````

## Notes

- Every `<d-block-timeline-item>` must define a `date` attribute.
- Timeline tags are optional and should be declared with `<d-block-timeline-tag>` inside the item body.
- `<d-block-timeline-tag>` supports plain text content or a `label` attribute, plus optional `color`, `text-color`, and `icon` attributes.
- `anchor` is optional. When omitted, Docsector generates a unique hash from the item date plus the first visible text block inside the item.
- Item bodies support regular Markdown, alerts, fenced code, math, tables, images, and nested Docsector blocks that already work in normal page sections.
- Headings inside timeline items are flattened into paragraph output so the page-level table of contents stays stable.
- Timeline items do not add extra nodes to the right-side page TOC; deep links still work through normal hash URLs.
- Keep a clear leading heading or paragraph near the top of each item so generated anchors stay readable.