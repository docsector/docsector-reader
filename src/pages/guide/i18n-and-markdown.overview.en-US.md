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

### Custom Attributes

The `markdown-it-attrs` plugin enables custom attributes using `:attr;` syntax:

```
:filename="example.php";
```

This is used by `DPageSourceCode` to display filenames above code blocks.

## Adding a New Language

1. Create `src/i18n/languages/xx-XX.hjson` with all UI translations
2. Add the language to `docsector.config.js` languages array
3. Add the locale to `src/i18n/index.js` langs array
4. Create `.md` files for each page with the new locale suffix
5. Add a flag image to `public/images/flags/`

## Vite HJSON Plugin

Docsector includes a custom Vite plugin that transforms HJSON imports into JSON at build time. This is configured automatically in `quasar.config.js` — no additional setup needed.
