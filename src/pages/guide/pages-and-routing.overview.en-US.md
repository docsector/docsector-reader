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

- **book** — Route prefix: `'guide'`, `'manual'`, or `'API'` (legacy `type` is still supported)
- **status** — Page status: `'done'`, `'draft'`, `'empty'`, or `'new'`; `new` is shown in green
- **version** — Optional version where the page was introduced, shown under the last updated date as `New in: ...` (for example, `'v2.1.0'`)
- **icon** — Material Design icon name shown in the sidebar
- **menu** — Object controlling menu display (header, subheader, separator)
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
  separator: ' page'           // CSS class suffix for separator
&#125;
```

## Markdown File Convention

Each page requires Markdown files following this naming pattern:

`src/pages/&#123;book&#125;/&#123;path&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`

For example, a page at `/content/blocks/headings` with book `manual`:

- `src/pages/manual/content/blocks/headings.overview.en-US.md`
- `src/pages/manual/content/blocks/headings.overview.pt-BR.md`
- `src/pages/manual/content/blocks/headings.showcase.en-US.md` (if showcase enabled)

## Route Generation

Routes are automatically generated from the page registry. A page with path `/my-page` and book `guide` produces:

- `/guide/my-page/overview` — Main content tab
- `/guide/my-page/showcase` — Showcase tab (if enabled)
- `/guide/my-page/vs` — Comparison tab (if enabled)

Archived major versions use the same structure under `src/pages/.old/&#123;version&#125;/`. A page registered in `src/pages/.old/v0.x/guide.index.js` produces `/v0.x/guide/my-page/overview` while the current version remains `/guide/my-page/overview`.
