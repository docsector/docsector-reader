## Visão Geral

Rodapé da Página é a **área inferior de informação** que exibe ações de GitHub, feedback da página e links de navegação anterior/próximo.

Na implementação, esta página descreve o `DPageMeta`.

## Páginas Focadas no Basic

- [Editar no GitHub](/manual/basic/edit-on-github/overview/)
- [Feedback da Página](/manual/basic/page-feedback/overview/)
- [Anterior e Próximo](/manual/basic/previous-and-next/overview/)

## Seções

### Editar no GitHub

Um botão que linka para o arquivo fonte Markdown no GitHub. A URL é composta de:

- `docsector.config.js` → `github.editBaseUrl`
- Caminho da rota atual (transformado para corresponder à convenção de nomes de arquivo)
- Locale atual

O label do botão muda baseado no status da página:

| Status | Label | Cor |
|--------|-------|-----|
| `done` | "Edite esta página" | Branco |
| `new` | "Edite esta página" | Branco |
| `draft` | "Complete esta página" | Warning (laranja) |
| `empty` | "Comece esta página" | Vermelho |

### Feedback da Página

Quando `feedback.enabled` é `true`, a pergunta **"Esta página foi útil?"** com três carinhas fica à direita do botão do GitHub. Cada voto é gravado por uma Cloudflare Pages Function gerada no build. Veja [Feedback da Página](/manual/basic/page-feedback/overview/) para a configuração.

### Navegação Anterior/Próximo

Links para as páginas anterior e próxima na sequência de rotas. O título da página é carregado do i18n. Links são mostrados apenas quando páginas adjacentes existem.

## Integração com Store

- `page/base` — Página atual para encontrar rotas prev/next
- `page/relative` — Subpágina atual, usada para montar a URL de "Editar no GitHub"

## Configuração

A URL "Editar no GitHub" é construída a partir do `docsector.config.js`:

```javascript
github: &#123;
  editBaseUrl: 'https://github.com/org/docs/edit/main/src/pages'
&#125;
```

## Desabilitando

O rodapé é automaticamente excluído quando `DPage` tem a prop `disableNav` definida como `true`.
