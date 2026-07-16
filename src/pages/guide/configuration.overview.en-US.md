## docsector.config.js

The `docsector.config.js` file at the project root controls all project-specific settings. This is the **only file** you need to customize to brand your documentation site.

## Branding

```javascript
branding: &#123;
  logo: '/images/logo.png',   // Path to logo in public/
  name: 'My Project',         // Project name shown in sidebar
  version: 'v1.0.0',          // Current version badge
  versions: [
    &#123; id: 'v1.0.0', current: true, released: false &#125;,
    &#123; id: 'v0.x', released: true, status: 'deprecated' &#125;
  ] // Version dropdown options
&#125;
```

The current version keeps unprefixed routes such as `/guide/getting-started/overview/`. Archived major versions can live under `src/pages/.old/&#123;version&#125;/` using the same book registry and Markdown layout, and are exposed at `/<version>/...`, for example `/v0.x/guide/getting-started/overview/`.

Every version shows a release badge next to the version in the selector. Released versions default to `released`; versions with `released: false` or `status: 'draft'` default to `draft`; versions with `status: 'deprecated'` or `deprecated: true` default to `deprecated` in red. Use `badge: &#123; label, color, textColor &#125;` to customize the badge.

The `logo` path is relative to the `public/` folder. Recommended size: **85×85px**.

## Links

```javascript
links: &#123;
  github: 'https://github.com/org/repo',
  discussions: 'https://github.com/org/repo/discussions',
  chat: 'https://discord.gg/your-invite',
  email: 'docs@example.com',
  changelog: '/changelog',
  roadmap: '/roadmap',
  sponsor: 'https://github.com/sponsors/org',
  explore: [
    &#123; label: 'Website', url: 'https://example.com' &#125;,
    &#123; label: 'Blog', url: 'https://blog.example.com' &#125;
  ]
&#125;
```

Set any link to `null` to hide it from the sidebar menu.

## GitHub Integration

```javascript
github: &#123;
  editBaseUrl: 'https://github.com/org/docs/edit/main/src/pages'
&#125;
```

This URL is used by the **DPageMeta** component to generate "Edit on GitHub" links. The page path and locale are automatically appended.

## Languages

```javascript
languages: [
  &#123;
    image: '/images/flags/united-states-of-america.png',
    label: 'English (US)',
    value: 'en-US'
  &#125;,
  &#123;
    image: '/images/flags/brazil.png',
    label: 'Português (BR)',
    value: 'pt-BR'
  &#125;
]
```

Each language needs:

- A **flag image** in `public/images/flags/`
- A **HJSON locale file** in `src/i18n/languages/`
- Corresponding **.md content files** for each page

## Default Language

```javascript
defaultLanguage: 'en-US'
```

The language used when no preference is stored in the user's browser.

## Updates

```javascript
updates: &#123;
  enabled: true,
  interval: 300000
&#125;
```

Controls the update notification — the banner readers see when a newer deploy is live, offering **Refresh** and **Dismiss**. Enabled by default in production builds; set `updates: false` to disable it entirely. `interval` is the time between checks in milliseconds (default 5 minutes, minimum 30 seconds). See [Update Notification](/manual/basic/update-notification) for how detection works.

## Full Example

```javascript
export default &#123;
  branding: &#123;
    logo: '/images/logo.png',
    name: 'Acme Docs',
    version: 'v2.1.0',
    versions: [
      &#123; id: 'v2.1.0', current: true, released: false &#125;,
      &#123; id: 'v2.0.0', released: true &#125;,
      &#123; id: 'v1.0.0', released: true, status: 'deprecated' &#125;
    ]
  &#125;,
  links: &#123;
    github: 'https://github.com/acme/acme',
    discussions: 'https://github.com/acme/acme/discussions',
    chat: null,
    email: 'hello@acme.dev',
    changelog: null,
    roadmap: null,
    sponsor: null,
    explore: null
  &#125;,
  github: &#123;
    editBaseUrl: 'https://github.com/acme/docs/edit/main/src/pages'
  &#125;,
  languages: [
    &#123; image: '/images/flags/united-states-of-america.png', label: 'English', value: 'en-US' &#125;
  ],
  defaultLanguage: 'en-US',
  updates: &#123;
    enabled: true,
    interval: 300000
  &#125;
&#125;
```
