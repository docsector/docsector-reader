## Overview

The update notification keeps long-lived reader sessions in sync with your latest deploy.

When a new build of the documentation goes live, readers who still have an older session open see a floating notification at the top of the page — *"Updated content is available. Please refresh the page."* — with **Refresh** and **Dismiss** actions.

It works out of the box in production builds. No configuration is required.

## What Readers Notice

- A theme-colored banner floating at the top center when a newer deploy is live
- **Refresh** reloads the page onto the new build
- **Dismiss** hides the banner for that deploy until the next session
- Navigation keeps working right after a deploy, even from a stale session

## How a New Deploy Is Detected

Every production build stamps a build ID in two places:

- baked into the JavaScript bundle itself
- written to `version.json` at the site root, together with a `Cache-Control: no-cache` rule in the generated `_headers` file, so CDNs always revalidate it

While a tab is open, the app compares the two: once shortly after load, on a fixed interval while the tab is visible, and when the tab regains focus. As soon as the deployed ID differs from the running one, the banner appears.

On Cloudflare Pages the build ID is the commit SHA (`CF_PAGES_COMMIT_SHA`), so rebuilding the same commit never prompts readers. On other hosts, set `DOCSECTOR_BUILD_ID` in the build environment; without it, each build falls back to a unique timestamp.

## Stale Navigation Recovery

After a deploy, the hashed chunk files of the previous build no longer exist on the server. A reader running the old session who navigates to a not-yet-visited page would hit a failed import — a navigation that silently goes nowhere.

Docsector recovers automatically: it performs a full-page reload straight to the page the reader asked for, already on the new build. A guard prevents reload loops — if the same navigation fails again right away, the banner is shown instead of reloading forever.

## Turning It Off or Tuning It

Everything is controlled by the `updates` key in `docsector.config.js`:

```js :toolbar="true";
export default {
  updates: false
}
```

Or keep it enabled and tune the polling:

```js :toolbar="true";
export default {
  updates: {
    enabled: true,
    interval: 300000
  }
}
```

`interval` is the time between checks in milliseconds. The default is `300000` (5 minutes) and values below `30000` are clamped.

## Changing the Wording

The banner strings live in the `system.update` i18n keys. Override them in your own language files:

```text
system: {
  update: {
    message: 'New docs are live!',
    refresh: 'Reload',
    dismiss: 'Later'
  }
}
```

## Notes

- Checks run only in production builds — never during `docsector dev`.
- If `version.json` is missing (an older deploy, or a host that strips it), the feature silently does nothing.
- Dismissing remembers that specific deploy for the browser session; a newer deploy prompts again.
- The check is a tiny same-origin JSON request; with `Cache-Control: no-cache` it usually resolves as a cheap `304 Not Modified`.
