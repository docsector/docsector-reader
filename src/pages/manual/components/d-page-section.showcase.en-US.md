## Showcase

Here is the Markdown source that renders the content you see on the Overview tab:

```
## My Section Title

Paragraph text with **bold** and *italic*.

- Item one
- Item two
- Item three

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |

### Sub-Section

More content here.
```

Each element becomes a token in DPageSection's tokenizer. Headings create anchors in the right-side ToC tree.

## Supported Markdown Elements

DPageSection renders the following Markdown elements:

- Headings (H2 through H6)
- Paragraphs with inline formatting (bold, italic, links, code)
- Unordered and ordered lists
- Tables with headers
- Fenced code blocks with syntax highlighting

## Code Block with Filename

Use the `:filename;` attribute to display a filename header:

```php
echo "Hello, Docsector!";
```

The filename appears in the info bar above the code block along with the language identifier.
