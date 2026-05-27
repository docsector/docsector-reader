## Internationalization Pipeline

Docsector Reader uses **vue-i18n** with **HJSON** locale files and embedded **Markdown** content. The i18n system automatically loads and merges translations with page content at build time.

## Language Files

Language files are located in `src/i18n/languages/` as HJSON files:

- `en-US.hjson` — English translations
- `pt-BR.hjson` — Portuguese translations

These files contain UI strings for the menu, settings, page navigation, and other system labels.

## HJSON Structure

```javascript
&#123;
  _: &#123;
    home: &#123;
      texts: ['The official documentation of ']
    &#125;
    guide: &#123;&#125;
    manual: &#123;&#125;
    API: &#123;&#125;
  &#125;
  menu: &#123;
    search: 'Search'
    home: 'Home'
  &#125;
  page: &#123;
    edit: &#123;
      github: &#123; edit: 'Edit this page' &#125;
    &#125;
  &#125;
&#125;
```

The `_` object is the root namespace for pages. Page titles and content are **automatically injected** by the i18n loader from the page registry and Markdown files.

## Markdown Content

Documentation content is written in standard Markdown with some conventions:

### Headings

Use `##` through `######` for section headings. Each heading becomes a navigation anchor in the ToC tree.

### Code Blocks

Fenced code blocks support syntax highlighting via Prism.js:

- `php` — PHP code
- `bash` — Shell commands
- `html` — HTML markup
- `javascript` — JavaScript code

### Mermaid Diagrams

You can render Mermaid diagrams using fenced blocks with the `mermaid` language indicator. The diagrams automatically adapt to light and dark modes.

```
&#96;&#96;&#96;mermaid
flowchart TD

### GitHub Alerts

Docsector also supports GitHub-style alert blockquotes:

```markdown
> [!IMPORTANT]
> The original repository was archived.
>
> Continue development in the maintained repository.
```

Supported types are `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION`.
Regular blockquotes (without `[!TYPE]`) continue to work as normal.
  A[Start] --> B[End]
&#96;&#96;&#96;
```

### Custom Attributes

The `markdown-it-attrs` plugin enables custom attributes using `:attr;` syntax. Code fences support `filename`, `group`, `tab`, and `breadcrumb`:

````markdown
```php :group="example"; :tab="example.php"; :breadcrumb="src > example.php";
echo "Example";
```
```bash :group="example"; :tab="example.sh"; :breadcrumb="scripts > example.sh";
echo "Example"
```
````

`filename` is shown in the info bar for single blocks. Consecutive fences with the same `group` are rendered as tabs. `tab` sets the tab label, so filename-like labels such as `example.php` receive file icons in the tab. `breadcrumb` sets the breadcrumb segments above the active code block, and the final filename-like segment receives the same file icon.

### Expandable Content

Use `<d-expandable>` to hide secondary content without removing rich Markdown features from the page:

```markdown
<d-expandable title="More details">

Optional explanations, operational notes, or longer examples.

</d-expandable>
```

Set `open="true"` when the block should start expanded.

The expandable body supports paragraphs, lists, alerts, code blocks, Mermaid diagrams, tables, raw HTML, and quick links. Keep headings outside the expandable block in this first version, because headings inside the body are flattened to regular paragraphs to preserve the page ToC.

## Adding a New Language

1. Create `src/i18n/languages/xx-XX.hjson` with all UI translations
2. Add the language to `docsector.config.js` languages array
3. Add the locale to `src/i18n/index.js` langs array
4. Create `.md` files for each page with the new locale suffix
5. Add a flag image to `public/images/flags/`

## Vite HJSON Plugin

Docsector includes a custom Vite plugin that transforms HJSON imports into JSON at build time. This is configured automatically in `quasar.config.js` — no additional setup needed.
