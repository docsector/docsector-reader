## Overview

Stepper blocks render a native Quasar vertical Stepper inside Markdown, combining numbered headers, built-in navigation, and rich step content.

They work well for onboarding flows, installation guides, release routines, and troubleshooting instructions where readers should move through a sequence in order.

The block is authored with the custom Markdown elements `<d-block-stepper>` and `<d-block-step>`.

## HTML Example

````html
<d-block-stepper>
  <d-block-step title="Install dependencies">

Run `npm install` in the project root.

  </d-block-step>

  <d-block-step title="Start the development server">

Run `npm run dev` and open the local URL shown in the terminal.

  </d-block-step>

  <d-block-step title="Verify the result">

> [!TIP]
> Keep each step focused on one outcome.

```bash
npm run test
```

  </d-block-step>

  <d-block-step
    title="Ship the release"
    icon="rocket_launch"
    active-icon="rocket_launch"
    done-icon="task_alt"
  >

Use icon attributes when a numbered prefix is not expressive enough for the step.

  </d-block-step>
</d-block-stepper>
````

## Notes

- Every `<d-block-step>` must define a `title`.
- The block uses Quasar's native vertical Stepper, so readers can move through the sequence using the step headers or the built-in navigation buttons.
- Step bodies support regular Markdown content such as paragraphs, lists, alerts, code fences, images, tables, and math.
- Each step can override the header icon through `icon`, `active-icon`, `done-icon`, and `error-icon`.
- Intermediate steps show Continue and Back actions; the last step swaps the primary action to Finish.
- Readers can also jump to any step directly from the headers.
- Only the active step body is expanded at a time; previous and next steps stay visible in the header stack.
- Headings inside a step are flattened into paragraph output so the page table of contents stays stable.
- Treat nested Stepper blocks and other custom Docsector blocks inside a step as unsupported in this first version.