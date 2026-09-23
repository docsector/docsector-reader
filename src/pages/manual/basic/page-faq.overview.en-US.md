---
faq:
  - q: Can I write the FAQ as a normal section in the page body?
    a: |
      You can, but you lose what the `faq` key gives you: the fixed position after
      the content, the accordion, deep links that open the question, the FAQPage
      JSON-LD and the `## FAQ` section agents read. Keep questions in the frontmatter.
  - q: Do showcase and vs subpages get their own FAQ?
    a: Yes. Each Markdown file has its own frontmatter, so `page.showcase.en-US.md` can declare a `faq` for the Showcase tab.
  - q: How do I change the "FAQ" title?
    a: Override `page.faq.title` in your language files — see [Wording](#wording).
---

## Overview

Page FAQ closes a page with a **frequently asked questions** accordion. You declare the questions in the page's frontmatter, and Docsector renders them after the content, above the page footer, with a matching entry in the Table of Contents.

There is nothing to enable: any page whose frontmatter has a `faq` key gets the section, and pages without one render nothing.

## Add an FAQ

List the questions under `faq`, each with a `q` (question) and an `a` (answer):

```markdown
---
title: Getting started
faq:
  - q: What is Docsector?
    a: A documentation engine built on Vue 3 and Quasar.
  - q: Is it free?
    a: Yes, it is MIT licensed.
---

## Install
```

The questions render in the order you write them, all closed. Readers can open several at once.

## Write Longer Answers

Answers are full Markdown: links, inline code, lists and code blocks all work. For an answer that spans several lines, use `a: |` and indent the text below it:

````markdown
---
faq:
  - q: How do I publish the site?
    a: |
      Build it:

      ```bash
      docsector build
      ```

      Then deploy `dist/spa` — see the [deploy guide](/guide/deployment/overview/).
---
````

`a: >` folds the lines into one paragraph instead. A question may carry inline Markdown too, such as `` `code` ``.

## Link to a Question

The section gets the `#faq` anchor, and each question gets `#faq-` plus its text in slug form. For example, "Is it free?" becomes `#faq-is-it-free`. Opening a link with that hash scrolls to the question and expands it:

```markdown
See [the license question](/guide/getting-started/overview/#faq-is-it-free).
```

When the page already has a heading with the same slug, Docsector adds a numeric suffix (`#faq-1`) so every anchor stays unique.

## What Search Engines and Agents Get

- The prerendered HTML carries a schema.org **FAQPage** JSON-LD block with the questions and plain-text answers. With SSR, it is part of the rendered head. With the static build, it is injected for the default language.
- The Markdown served to agents (the `.md` files, markdown negotiation, `llms-full.txt`, MCP and AI Search) drops `faq` from the frontmatter and ends with a readable `## FAQ` section instead.
- The site search does not index FAQ entries.

## Wording

The section title comes from the `page.faq.title` language key. Override it in your language files:

```hjson
page: {
  faq: {
    title: 'Common questions'
  }
}
```

## Reference

### Frontmatter

```markdown
faq:
  - q: Question text (inline Markdown)
    a: Answer text (Markdown), or a | / > block
```

| Field | Description |
|-------|-------------|
| `q` | The question. Required; an item without it is skipped with a build warning. |
| `a` | The answer, in Markdown. Required; an item without it is skipped with a build warning. |

The key applies per file: `overview`, `showcase` and `vs` each declare their own FAQ. It never enters the page registry.

### Anchors

| Anchor | Target |
|--------|--------|
| `#faq` | The FAQ section (the ToC entry) |
| `#faq-<question-slug>` | One question — opening it expands the answer |

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is it free?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, it is MIT licensed." }
    }
  ]
}
```

### Language keys

| Key | English | Português |
|-----|---------|-----------|
| `page.faq.title` | FAQ | Perguntas frequentes |
