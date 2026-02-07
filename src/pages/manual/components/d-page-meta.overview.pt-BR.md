## Visão Geral

`DPageMeta` é o componente de **rodapé de página** que exibe integração com GitHub, progresso de tradução e links de navegação anterior/próximo.

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
| `draft` | "Complete esta página" | Warning (laranja) |
| `empty` | "Comece esta página" | Vermelho |

### Progresso de Tradução

Dois chips são exibidos:

- **Progresso do idioma** — Mostra a porcentagem de conclusão da tradução para o locale atual baseado no metadata `_sections.done / _sections.count`
- **Traduções disponíveis** — Mostra quantos locales têm traduções comparado ao total de locales disponíveis

### Navegação Anterior/Próximo

Links para as páginas anterior e próxima na sequência de rotas. O título da página é carregado do i18n. Links são mostrados apenas quando páginas adjacentes existem.

## Integração com Store

- `page/base` — Página atual para encontrar rotas prev/next
- `i18n/absolute` — Caminho para carregar metadata de tradução

## Configuração

A URL "Editar no GitHub" é construída a partir do `docsector.config.js`:

```javascript
github: &#123;
  editBaseUrl: 'https://github.com/org/docs/edit/main/src/pages'
&#125;
```

## Desabilitando

DPageMeta é automaticamente excluído quando `DPage` tem a prop `disableNav` definida como `true`.
