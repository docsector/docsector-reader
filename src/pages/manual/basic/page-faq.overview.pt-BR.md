---
faq:
  - q: Posso escrever o FAQ como uma seção normal no corpo da página?
    a: |
      Pode, mas perde o que a chave `faq` oferece: a posição fixa depois do
      conteúdo, o acordeão, os links diretos que abrem a pergunta, o JSON-LD
      FAQPage e a seção `## FAQ` que os agentes leem. Mantenha as perguntas no frontmatter.
  - q: As subpáginas showcase e vs têm FAQ próprio?
    a: Sim. Cada arquivo Markdown tem o próprio frontmatter, então `pagina.showcase.pt-BR.md` pode declarar um `faq` para a aba Showcase.
  - q: Como mudo o título "Perguntas frequentes"?
    a: Sobrescreva `page.faq.title` nos seus arquivos de idioma — veja [Textos](#textos).
---

## Visão Geral

O FAQ da Página fecha uma página com um acordeão de **perguntas frequentes**. Você declara as perguntas no frontmatter da página, e o Docsector as renderiza depois do conteúdo, acima do rodapé, com uma entrada correspondente no sumário (ToC).

Não há nada para habilitar: toda página cujo frontmatter tem a chave `faq` ganha a seção, e páginas sem ela não renderizam nada.

## Adicionando um FAQ

Liste as perguntas em `faq`, cada uma com um `q` (pergunta) e um `a` (resposta):

```markdown
---
title: Primeiros passos
faq:
  - q: O que é o Docsector?
    a: Um motor de documentação construído com Vue 3 e Quasar.
  - q: É gratuito?
    a: Sim, tem licença MIT.
---

## Instalação
```

As perguntas aparecem na ordem em que você as escreve, todas fechadas. O leitor pode abrir várias ao mesmo tempo.

## Respostas mais longas

As respostas são Markdown completo: links, código inline, listas e blocos de código funcionam. Para uma resposta com várias linhas, use `a: |` e indente o texto abaixo:

````markdown
---
faq:
  - q: Como publico o site?
    a: |
      Faça o build:

      ```bash
      docsector build
      ```

      Depois publique `dist/spa` — veja o [guia de deploy](/guide/deployment/overview/).
---
````

`a: >` junta as linhas num único parágrafo. A pergunta também aceita Markdown inline, como `` `código` ``.

## Linkando uma pergunta

A seção recebe a âncora `#faq`, e cada pergunta recebe `#faq-` mais o texto dela em forma de slug. Por exemplo, "É gratuito?" vira `#faq-é-gratuito`. Abrir um link com esse hash rola até a pergunta e a expande:

```markdown
Veja [a pergunta da licença](/guide/getting-started/overview/#faq-é-gratuito).
```

Quando a página já tem um título com o mesmo slug, o Docsector acrescenta um sufixo numérico (`#faq-1`), para toda âncora continuar única.

## O que buscadores e agentes recebem

- O HTML pré-renderizado leva um bloco JSON-LD **FAQPage** do schema.org com as perguntas e as respostas em texto simples. Com SSR, ele faz parte do head renderizado. No build estático, ele é injetado para o idioma padrão.
- O Markdown servido aos agentes (os arquivos `.md`, a negociação de markdown, o `llms-full.txt`, o MCP e o AI Search) tira o `faq` do frontmatter e termina com uma seção `## FAQ` legível no lugar.
- A busca do site não indexa as entradas do FAQ.

## Textos

O título da seção vem da chave de idioma `page.faq.title`. Sobrescreva nos seus arquivos de idioma:

```hjson
page: {
  faq: {
    title: 'Dúvidas comuns'
  }
}
```

## Referência

### Frontmatter

```markdown
faq:
  - q: Texto da pergunta (Markdown inline)
    a: Texto da resposta (Markdown), ou um bloco | / >
```

| Campo | Descrição |
|-------|-----------|
| `q` | A pergunta. Obrigatória; um item sem ela é pulado com um warning no build. |
| `a` | A resposta, em Markdown. Obrigatória; um item sem ela é pulado com um warning no build. |

A chave vale por arquivo: `overview`, `showcase` e `vs` declaram cada um o próprio FAQ. Ela nunca entra no registro das páginas.

### Âncoras

| Âncora | Destino |
|--------|---------|
| `#faq` | A seção do FAQ (a entrada do ToC) |
| `#faq-<slug-da-pergunta>` | Uma pergunta — abrir o link expande a resposta |

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "É gratuito?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sim, tem licença MIT." }
    }
  ]
}
```

### Chaves de idioma

| Chave | English | Português |
|-------|---------|-----------|
| `page.faq.title` | FAQ | Perguntas frequentes |
