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

See the dedicated manual pages for block-by-block reference:

- [Paragraphs](/manual/content/blocks/paragraphs/overview/), [Headings](/manual/content/blocks/headings/overview/), [Unordered lists](/manual/content/blocks/unordered-lists/overview/), [Ordered lists](/manual/content/blocks/ordered-lists/overview/)
- [Hints](/manual/content/blocks/hints/overview/), [Quote](/manual/content/blocks/quotes/overview/), [Code blocks](/manual/content/blocks/code-blocks/overview/), [Mermaid diagrams](/manual/content/blocks/mermaid-diagrams/overview/)
- [Images](/manual/content/blocks/images/overview/), [Files](/manual/content/blocks/files/overview/), [Math & TeX](/manual/content/blocks/math-and-tex/overview/), [Expandable](/manual/content/blocks/expandable/overview/), [Tables](/manual/content/blocks/tables/overview/), [Raw HTML](/manual/content/blocks/raw-html/overview/), and [Quick Links](/manual/content/blocks/quick-links/overview/)

### Headings

Use `##` through `######` for section headings. Each heading becomes a navigation anchor in the ToC tree using a GitHub-compatible slug, so standard README fragments such as `#table-of-contents` work in Docsector too.

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
  A[Start] --> B[End]
&#96;&#96;&#96;
```

### Math and TeX

Docsector supports KaTeX-style math in standard Markdown flows, including paragraphs, alerts, and expandable content.

Use single dollar delimiters for inline math such as $E = mc^2$.

Use double dollar delimiters for display math:

```markdown
$$
\int_0^1 x^2 dx
$$
```

Math delimiters remain literal inside inline code and fenced code blocks, so syntax examples can be documented without rendering the equation.

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

Use `<d-block-expandable>` to hide secondary content without removing rich Markdown features from the page:

```markdown
<d-block-expandable title="More details">

Optional explanations, operational notes, or longer examples.

</d-block-expandable>
```

Set `open="true"` when the block should start expanded.

The expandable body supports paragraphs, lists, alerts, code blocks, Mermaid diagrams, tables, raw HTML, and quick links. Keep headings outside the expandable block in this first version, because headings inside the body are flattened to regular paragraphs to preserve the page ToC.

### File Blocks

Use `<d-block-file>` to publish downloadable attachments from repo-tracked files or external storage without leaving Markdown:

```html
<d-block-file src="/files/manual/release-checklist.txt" title="Release checklist" size="1 KB">
Download the example attachment used in this manual.
</d-block-file>
```

Store repo-tracked files under `public/files/` and prefer absolute site paths such as `/files/...`.

`title` and `size` are optional. When `title` is omitted, the UI falls back to the file name from `src`. The caption body supports inline Markdown, and the same syntax also works with external URLs if you later move storage to R2 or another CDN.

## Adding a New Language

1. Create `src/i18n/languages/xx-XX.hjson` with all UI translations
2. Add the language to `docsector.config.js` languages array
3. Add the locale to `src/i18n/index.js` langs array
4. Create `.md` files for each page with the new locale suffix
5. Add a flag image to `public/images/flags/`

## Vite HJSON Plugin

Docsector includes a custom Vite plugin that transforms HJSON imports into JSON at build time. This is configured automatically in `quasar.config.js` — no additional setup needed.
