---
desc: Define pages in split registries, or right inside the Markdown with Quasar-style frontmatter.
keys: frontmatter metadata yaml registry index standalone hidden
---

## Page Registry

Documentation pages are defined in split registries such as `src/pages/guide.index.js` and `src/pages/manual.index.js`. Each entry maps a URL path to its configuration, translatable data, and optional metadata.

In the current manual, it is common to keep core UI references under `/basic`, end-user content blocks under `/content/blocks`, structural concepts under `/content/structures`, and legacy engine-facing aliases under `/components`.

## Page Entry Structure

```javascript
'/my-page': &#123;
  config: &#123;
    icon: 'description',
    status: 'new',
    version: 'v2.1.0',
    book: 'guide',
    menu: &#123;&#125;,
    subpages: &#123; showcase: false &#125;
  &#125;,
  data: &#123;
    'en-US': &#123; title: 'My Page' &#125;,
    'pt-BR': &#123; title: 'Minha Página' &#125;
  &#125;
&#125;
```

## Config Properties

- **book** — Route prefix: `'guide'`, `'manual'`, or `'API'` (legacy `type` is still supported). An id that no `*.book.js` defines puts the page outside every book — see Standalone Pages below
- **status** — Page status: `'done'`, `'draft'`, `'empty'`, or `'new'`; `new` is shown in green
- **version** — Optional version where the page was introduced, shown under the last updated date as `New in: ...` (for example, `'v2.1.0'`)
- **icon** — Material Design icon name shown in the sidebar
- **menu** — Object controlling menu display (header, subheader, separators, hidden)
- **link** — `&#123; to: '/guide/getting-started/overview/' &#125;` turns the entry into a menu shortcut that redirects to that page; a shortcut into another book shows an arrow (→) in the menu
- **subpages** — Enable additional tabs: `showcase`, `vs`

## Category Nodes

Set `config: null` to create a non-navigable grouping node. This is useful for creating section titles in the sidebar menu:

```javascript
'/content/blocks': &#123;
  config: null,
  data: &#123;
    'en-US': &#123; title: 'Blocks' &#125;,
    'pt-BR': &#123; title: 'Blocos' &#125;
  &#125;
&#125;
```

## Menu Grouping

Pages are grouped in the sidebar by their **basepath** (second URL segment). The first page in a group can define a `menu.header`:

```javascript
menu: &#123;
  header: &#123;
    icon: 'notes',
    label: 'Content'
  &#125;
&#125;
```

## Subheaders and Separators

```javascript
menu: &#123;
  subheader: '.my-section',    // i18n path for subheader label
  separators: &#123;
    lineTop: true,             // line ABOVE the item
    lineBottom: true           // line BELOW the item
  &#125;
&#125;
```

A separator value can also name a thickness variant from the menu styles — `lineBottom: 'page'` or `lineBottom: 'list'` render a thicker line.

The legacy form `separator: true` (or a class-suffix string like `' page'`) is still supported and means a line **below** the item; when `separators` is present, it wins.

## Hidden Pages

Set `menu.hidden` to keep a page routed and published while the navigation skips it:

```javascript
menu: &#123; hidden: true &#125;
```

A hidden page:

- is not listed in the sidebar page tree, so the sidebar search never finds it;
- is skipped by the previous/next links, and shows none of its own;
- never becomes the landing page of its book tab, nor the fallback of the version selector;
- still has its routes, its prerendered HTML, its sitemap entry, its `.md` copy for agents, and its place in `llms.txt` and the MCP page list.

Link to it from a page, the footer or a sidebar top link.

## Markdown File Convention

Each page requires Markdown files following this naming pattern:

`src/pages/&#123;book&#125;/&#123;path&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`

For example, a page at `/content/blocks/headings` with book `manual`:

- `src/pages/manual/content/blocks/headings.overview.en-US.md`
- `src/pages/manual/content/blocks/headings.overview.pt-BR.md`
- `src/pages/manual/content/blocks/headings.showcase.en-US.md` (if showcase enabled)

A page keyed `''` — the root page of its book, or a standalone page — drops the path: `src/pages/&#123;book&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`, next to the book's folder.

## Markdown Frontmatter

A page's Markdown file may open with a frontmatter block — the same style the Quasar docs use, so pages migrated from a Quasar docs project keep their metadata:

```markdown
---
title: Ajax Bar
desc: The QAjaxBar component displays a loading bar when a request is in progress.
keys: QAjaxBar loading progress
related:
  - /quasar-plugins/loading
---

## Overview
```

The block is metadata, never content: it is removed from the rendered page, the Table of Contents, and the search content index. The raw `.md` served to agents (and `llms-full.txt`) keeps it verbatim — except `faq`, which leaves the block and becomes a readable `## FAQ` section at the end.

In-page metadata merges into the page's registry entry. A key present in both places is **overridden by the page**; a key present only in the page is **merged in**. Localized keys apply per file — frontmatter in `headings.overview.pt-BR.md` only touches the `pt-BR` values.

| Key | Effect |
| --- | ------ |
| `title` | Overrides the page title for that locale (`data.<locale>.title`) |
| `desc` | Overrides the page description for that locale (`config.meta.description.<locale>`) |
| `keys` | **Appends** to the sidebar search tags for that locale (`metadata.tags`) — registry tags are kept |
| `icon`, `status`, `version`, … | Scalar registry config keys, overridden from the `overview` file only. Object-valued keys (`menu`, `subpages`, `link`, `layouts`) and structural blocks (`meta`, `data`, `metadata`) cannot be set from frontmatter and warn at build time |
| `examples`, `related`, anything else | Stored on the page config untouched, available for future features |
| `faq` | Renders the page's closing FAQ from a list of `- q:` / `a:` items — see [Page FAQ](/manual/basic/page-faq/overview/). Applies per file, and never enters the registry |
| `book` / `type` | Never honored — the file's own path decides the book |

Subpage files (`showcase` / `vs`) may only override the `title` and `desc` of **their own subpage** (used by the prerendered `<title>`/description of that route), append `keys` and declare their own `faq`; other keys there warn at build time and are ignored.

The supported syntax is a YAML subset: `key: value` scalars (quoted strings, booleans, numbers, `null`; a value may continue on deeper-indented lines), block scalars (`|` literal, `>` folded, with the `-`/`+` chomping indicators), one-level lists, and lists of maps (`- q: …` items continued by lines indented to their first key — the `faq` form). A map directly under a key, inline collections and anchors are not supported — unsupported lines warn at build time and are skipped. The block only exists when `---` is the very first line of the file and it is closed by a `---` (or `...`) line; a `---` later in the document stays a plain thematic break.

## Route Generation

Routes are automatically generated from the page registry. A page with path `/my-page` and book `guide` produces:

- `/guide/my-page/overview` — Main content tab
- `/guide/my-page/showcase` — Showcase tab (if enabled)
- `/guide/my-page/vs` — Comparison tab (if enabled)

Archived major versions use the same structure under `src/pages/.old/&#123;version&#125;/`. A page registered in `src/pages/.old/v0.x/guide.index.js` produces `/v0.x/guide/my-page/overview` while the current version remains `/guide/my-page/overview`.

## Standalone Pages

A standalone page lives outside every book: no book tab is highlighted on it and no page tree lists it. Use one for pages about the project rather than its docs — sponsoring, advertising, the team — and open it from a sidebar top link.

**1. Register it** as the last entry of any index whose book is not fullwidth (for example `src/pages/guide.index.js`), keyed `''`:

```javascript
'': &#123;
  config: &#123;
    book: 'sponsors',
    icon: 'favorite',
    status: 'done',
    menu: &#123; hidden: true &#125;
  &#125;,
  data: &#123;
    'en-US': &#123; title: 'Sponsors' &#125;,
    'pt-BR': &#123; title: 'Patrocinadores' &#125;
  &#125;
&#125;
```

`book` names an id that no `*.book.js` defines: it becomes the route prefix and gets no tab. `menu.hidden` keeps the page out of previous/next, which runs across every book, and off the page tree shown on the page itself.

**2. Write its Markdown** at the root of `src/pages/`:

- `src/pages/sponsors.overview.en-US.md`
- `src/pages/sponsors.overview.pt-BR.md`

Frontmatter (`title`, `desc`, `keys`, `faq`) works as on any page.

**3. Link it.** The page answers at `/sponsors/overview/`, and `/sponsors` redirects there. Point a sidebar top link — and the sponsors fallback, for a sponsors page — at the bare path:

```javascript
links: &#123; sponsor: '/sponsors/' &#125;,
sponsors: &#123; enabled: true, fallbackUrl: '/sponsors/' &#125;
```

The Sponsor link then opens the page in the same tab and stays highlighted while it is open — see the [Navigation Menu](/manual/basic/d-menu/overview/).

What readers see on a standalone page:

| Area | Behavior |
| --- | --- |
| Book tabs | None is highlighted; every tab still opens its book |
| Sidebar | Version selector and top links; no page tree, so the search, which filters it, is disabled |
| Previous / next | None |
| Content | Table of Contents, FAQ, feedback, sponsors and page ad, like any page |
| Build | Prerendered HTML, sitemap entry, `.md` for agents, its own section in `llms.txt` and a row in the MCP page list; not in the sidebar search index |

Rules:

- Declare standalone pages in the current pages root, never under `src/pages/.old/&#123;version&#125;/` — the build warns there, because a top link is one fixed path.
- The id must not be a registered book id, a folder under `public/`, or a reserved route path: `assets`, `assistant`, `home`, `mcp`, and — for the page keyed `''` — `404`, `feedback`, `index` (the build warns on those).
- One `''` key per index. More pages under the same id use named keys with the same `book` and `menu.hidden`: `'/team'` answers at `/sponsors/team/overview/` from `src/pages/sponsors/team.overview.&#123;lang&#125;.md`.
- The page takes the `layouts` of the book whose index declares it; set `layouts` on the entry to change them.
- `book` and `menu` cannot come from frontmatter.
