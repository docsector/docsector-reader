## Showcase

The examples below use the native vertical Quasar Stepper renderer. Click a step header or use the navigation buttons inside the active step.

### Basic Setup Flow

<d-block-stepper>
  <d-block-step title="Install dependencies">

Run `npm install` in the project root.

  </d-block-step>

  <d-block-step title="Start the development server">

Run `npm run dev` and keep the terminal open while you work.

  </d-block-step>

  <d-block-step title="Open the app">

Visit the local URL printed by the CLI and confirm the homepage loads.

  </d-block-step>
</d-block-stepper>

### Rich Markdown

<d-block-stepper>
  <d-block-step title="Check the prerequisites">

- Node.js 20 or newer
- npm 9 or newer
- Access to the project repository

  </d-block-step>

  <d-block-step title="Run the smoke checks">

> [!TIP]
> Fix lint or test failures before opening a pull request.

```bash
npm run lint
npm run test
```

  </d-block-step>

  <d-block-step title="Capture the outcome">

Attach the command output, note any warnings, and link the related issue or pull request.

  </d-block-step>
</d-block-stepper>

### Troubleshooting Sequence

<d-block-stepper>
  <d-block-step title="Reproduce the issue">

Describe the exact page, browser, and action that triggered the problem.

  </d-block-step>

  <d-block-step title="Collect evidence">

Take a screenshot, copy the console output, and note whether the issue also happens on mobile.

  </d-block-step>

  <d-block-step title="Validate the fix">

Repeat the same flow after the change and confirm the original failure no longer appears.

  </d-block-step>
</d-block-stepper>

### Custom Header Icons

<d-block-stepper>
  <d-block-step title="Connect the repository" icon="folder_open" active-icon="folder_open" done-icon="task_alt">

Clone the repository or open the existing local workspace before starting the workflow.

  </d-block-step>

  <d-block-step title="Review the issue" icon="manage_search" active-icon="manage_search" done-icon="task_alt">

Read the reproduction steps, confirm the scope, and identify the narrowest possible fix.

  </d-block-step>

  <d-block-step title="Ship the patch" icon="rocket_launch" active-icon="rocket_launch" done-icon="verified">

Run the focused checks, update the docs, and prepare the change for review.

  </d-block-step>
</d-block-stepper>

### Different Icons Per State

<d-block-stepper>
  <d-block-step title="Draft the plan" active-icon="edit_note" done-icon="task_alt">

Keep the numeric prefix while the step is idle, then switch to a clearer icon while it is active or completed.

  </d-block-step>

  <d-block-step title="Validate the output" active-icon="play_circle" done-icon="check_circle">

This pattern is useful when you want numbered headers by default but still want visual feedback during execution.

  </d-block-step>
</d-block-stepper>