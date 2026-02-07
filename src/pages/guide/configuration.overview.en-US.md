## docsector.config.js

The `docsector.config.js` file at the project root controls all project-specific settings. This is the **only file** you need to customize to brand your documentation site.

## Branding

```javascript
branding: &#123;
  logo: '/images/logo.png',   // Path to logo in public/
  name: 'My Project',         // Project name shown in sidebar
  version: 'v1.0.0',          // Current version badge
  versions: ['v1.0.0']        // Version dropdown options
&#125;
```

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

## Full Example

```javascript
export default &#123;
  branding: &#123;
    logo: '/images/logo.png',
    name: 'Acme Docs',
    version: 'v2.1.0',
    versions: ['v2.1.0', 'v2.0.0', 'v1.0.0']
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
  defaultLanguage: 'en-US'
&#125;
```
