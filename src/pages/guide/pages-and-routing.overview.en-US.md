## Page Registry

All documentation pages are defined in `src/pages/index.js`. Each entry maps a URL path to its configuration, translatable data, and optional metadata.

## Page Entry Structure

```javascript
'/my-page': &#123;
  config: &#123;
    icon: 'description',
    status: 'done',
    type: 'guide',
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

- **type** — Route prefix: `'guide'`, `'manual'`, or `'API'`
- **status** — Page status: `'done'`, `'draft'`, or `'empty'`
- **icon** — Material Design icon name shown in the sidebar
- **menu** — Object controlling menu display (header, subheader, separator)
- **subpages** — Enable additional tabs: `showcase`, `vs`

## Category Nodes

Set `config: null` to create a non-navigable grouping node. This is useful for creating section titles in the sidebar menu:

```javascript
'/components': &#123;
  config: null,
  data: &#123;
    'en-US': &#123; title: 'Components' &#125;,
    'pt-BR': &#123; title: 'Componentes' &#125;
  &#125;
&#125;
```

## Menu Grouping

Pages are grouped in the sidebar by their **basepath** (second URL segment). The first page in a group can define a `menu.header`:

```javascript
menu: &#123;
  header: &#123;
    icon: 'widgets',
    label: 'Components'
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

`src/pages/&#123;type&#125;/&#123;path&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`

For example, a page at `/components/d-page` with type `manual`:

- `src/pages/manual/components/d-page.overview.en-US.md`
- `src/pages/manual/components/d-page.overview.pt-BR.md`
- `src/pages/manual/components/d-page.showcase.en-US.md` (if showcase enabled)

## Route Generation

Routes are automatically generated from the page registry. A page with path `/my-page` and type `guide` produces:

- `/guide/my-page/overview` — Main content tab
- `/guide/my-page/showcase` — Showcase tab (if enabled)
- `/guide/my-page/vs` — Comparison tab (if enabled)
