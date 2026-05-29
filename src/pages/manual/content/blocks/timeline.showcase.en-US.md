## Showcase

The examples below show changelog-style timelines with rich content, tags, repeated dates, and direct-link anchors.

### Long scrolling content with multiple entries

<d-block-timeline>
  <d-block-timeline-item date="2025-12-18">

<d-block-timeline-tag color="warning" icon="rocket_launch">release</d-block-timeline-tag>
<d-block-timeline-tag color="secondary" text-color="white">migration</d-block-timeline-tag>

## Migration preparation

Start by documenting the exact scope of the rollout, including the pages, integrations, and deployment windows that are affected by the change.

Create a short checklist for the team, then confirm which parts of the rollout can happen in parallel and which ones must stay serialized.

- Confirm the affected environments
- Capture rollback steps
- Note any user-facing communication that must ship together with the release

~~~bash
npm run lint
npm run test
npm run build
~~~

  </d-block-timeline-item>

  <d-block-timeline-item date="2025-12-19">

<d-block-timeline-tag color="primary" text-color="white">operations</d-block-timeline-tag>
<d-block-timeline-tag color="orange" text-color="white">rollout</d-block-timeline-tag>

## Incremental rollout

Ship the first slice to a smaller audience, watch the error budget, and log any unexpected behavior before widening exposure.

If the metrics remain healthy, continue with the second rollout wave and update the changelog entry with the exact time and the observed result.

> [!TIP]
> Sticky dates and dots are easier to verify when each item contains enough body content to scroll independently.

  </d-block-timeline-item>

  <d-block-timeline-item date="2025-12-20">

<d-block-timeline-tag color="teal" text-color="white">follow-up</d-block-timeline-tag>
<d-block-timeline-tag color="grey-8" text-color="white">docs</d-block-timeline-tag>

## Post-release follow-up

After the rollout finishes, collect the final metrics, summarize what changed, and add links to the support article, incident notes, or migration guide.

This entry is intentionally long enough to help verify the comfortable-layout sticky behavior on later timeline items, not only on the first one.

  </d-block-timeline-item>
</d-block-timeline>

### Single long entry

<d-block-timeline>
  <d-block-timeline-item date="2025-11-30">

<d-block-timeline-tag color="brown-5" text-color="white">single</d-block-timeline-tag>
<d-block-timeline-tag color="indigo" text-color="white" icon="push_pin">sticky-check</d-block-timeline-tag>

## One long entry for sticky checks

Use a single-item timeline when you want to confirm that the date and dot still stick correctly even without later entries extending the rail.

Repeat enough explanatory content here to create real scroll distance for the item and confirm the left-side metadata remains visible while the body moves.

Repeat enough explanatory content here to create real scroll distance for the item and confirm the left-side metadata remains visible while the body moves.

Repeat enough explanatory content here to create real scroll distance for the item and confirm the left-side metadata remains visible while the body moves.

  </d-block-timeline-item>
</d-block-timeline>

### Product updates

<d-block-timeline>
  <d-block-timeline-item date="2026-05-07">

<d-block-timeline-tag color="warning" icon="campaign">release</d-block-timeline-tag>
<d-block-timeline-tag color="amber-8" text-color="white">permissions</d-block-timeline-tag>

## Site permissions update

We simplified inheritance so site-level permissions are now easier to reason about across linked content.

  </d-block-timeline-item>

  <d-block-timeline-item date="2026-04-28">

<d-block-timeline-tag color="positive" text-color="white">improvement</d-block-timeline-tag>
<d-block-timeline-tag color="primary" text-color="white" icon="search">search</d-block-timeline-tag>

## Faster site search

Readers now get faster results from a local index, followed by remote refinement when more matches arrive.

  </d-block-timeline-item>
</d-block-timeline>

### Rich markdown inside entries

<d-block-timeline>
  <d-block-timeline-item date="2026-03-04">

<d-block-timeline-tag color="warning" icon="science">beta</d-block-timeline-tag>
<d-block-timeline-tag color="deep-orange" text-color="white">rss</d-block-timeline-tag>

## Update blocks with RSS support

> [!TIP]
> Use tags to label beta or rollout-specific entries.

~~~bash
npm run build
npm run release
~~~

<d-block-quick-links title="Related links">
  <d-block-quick-link title="Guide" description="Open the getting started guide" to="/guide/getting-started" />
  <d-block-quick-link title="Repository" description="View the source code" href="https://github.com/docsector/docsector-reader" icon="launch" />
</d-block-quick-links>

  </d-block-timeline-item>
</d-block-timeline>

### Explicit anchors

<d-block-timeline>
  <d-block-timeline-item date="2026-02-11" anchor="custom-icons-release">

<d-block-timeline-tag color="purple" text-color="white" icon="palette">ux</d-block-timeline-tag>

## Custom icons in hint blocks

Use the `anchor` attribute when you want a stable fragment that does not depend on the visible title copy.

  </d-block-timeline-item>
</d-block-timeline>

### Repeated dates with unique generated anchors

<d-block-timeline>
  <d-block-timeline-item date="2026-01-05">

<d-block-timeline-tag color="positive" text-color="white">improvement</d-block-timeline-tag>

## New year improvements

Generated anchors stay unique even if another item reuses the same date and title.

  </d-block-timeline-item>

  <d-block-timeline-item date="2026-01-05">

<d-block-timeline-tag color="negative" text-color="white">fixes</d-block-timeline-tag>

## New year improvements

This second entry gets a deduplicated hash suffix automatically.

  </d-block-timeline-item>
</d-block-timeline>
