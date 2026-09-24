## Visão Geral

Menu de Navegação é a **barra lateral esquerda** usada para explorar a documentação.

Na implementação, esta página descreve o `DMenu`.

## Páginas Focadas no Basic

- [Busca](/manual/basic/search/overview/)
- [Branding](/manual/basic/branding/overview/)
- [Seletor de Versão](/manual/basic/version-switcher/overview/)

## Funcionalidades

- **Busca** — Filtra páginas pesquisando conteúdo, títulos e tags
- **Seção de branding** — Logo, nome do projeto, seletor de versão
- **Links do topo** — Changelog, roadmap e sponsor: URLs abrem em nova aba, páginas do site abrem no lugar
- **Seção explore** — Links customizados, com a mesma regra
- **Botões do rodapé** — Website, GitHub, discussões, chat, email
- **Árvore de páginas** — Gerada automaticamente do registro de páginas com painéis de expansão

## Busca

O input de busca no topo do menu filtra páginas comparando o termo de busca com:

1. **Tags** — Definidas por página em `src/pages/*.index.js` em `metadata.tags`
2. **Conteúdo da página** — O source Markdown de cada sub-página overview, showcase e vs

A busca tem debounce de 300ms e suporta o locale atual com fallback para en-US. Ela filtra a árvore de páginas do book atual, então fica desabilitada numa página fora de todos os books.

## Seção de Branding

O menu lê seus dados de branding a partir de `docsector.config.js`:

- `branding.logo` — Imagem do logo do projeto
- `branding.name` — Texto do nome do projeto
- `branding.version` — Versão atual
- `branding.versions` — Opções do dropdown de versão, incluindo badges opcionais de release

O seletor mantém a documentação atual em rotas sem prefixo e troca versões arquivadas para rotas prefixadas. Por exemplo, `/guide/getting-started/overview/` pode trocar para `/v0.x/guide/getting-started/overview/` quando existe uma página equivalente em `src/pages/.old/v0.x/`.

Todo objeto de versão mostra um badge depois do label da versão. Versões lançadas usam `released` por padrão; versões com `released: false` ou `status: 'draft'` usam `draft`; versões com `status: 'deprecated'` ou `deprecated: true` usam `deprecated` em vermelho. O badge pode ser customizado com `badge: { label, color, textColor }`.

## Links do Topo

Abaixo do branding, o menu lista Home, depois **Changelog**, **Roadmap** e **Sponsor**, e então a lista **Explore**. Cada link só aparece quando o seu valor em `links` está definido — `null` o oculta. O valor decide como ele abre:

| Valor | Abre |
| --- | --- |
| Uma URL (`https://…`) | Em nova aba, com o ícone de link externo |
| O caminho de uma página deste site (`/sponsors/`) | No lugar, destacado enquanto a página está aberta |
| Qualquer outro caminho (`/feed.xml`, um arquivo em `public/`) | Em nova aba, com o ícone de link externo |

```js
links: {
  changelog: 'https://github.com/example/project/releases',
  sponsor: '/sponsors/',
  explore: [
    { label: 'Awesome list', url: 'https://github.com/example/awesome' }
  ]
}
```

Para uma página, prefira o caminho sem subpágina (`/sponsors/` em vez de `/sponsors/overview/`): assim o link continua destacado nas abas showcase e vs da página. No `docsector dev`, um caminho que parece uma página mas não corresponde a nenhuma mostra um warning, e o link continua abrindo em nova aba.

O destino mais comum de um link no lugar é uma página fora de todos os books — veja Páginas Avulsas em [Páginas e Rotas](/guide/pages-and-routing/overview/).

## Botões do Rodapé

Website, Email, Chat, Discussions e GitHub são botões de ícone abaixo do menu. Eles abrem em nova aba; defina um link como `null` para ocultar o botão.

## Árvore de Páginas

A árvore de páginas é construída a partir das rotas do roteador no momento de criação do componente. Rotas são filtradas pela versão e pelo book ativos, depois agrupadas pelo basepath da página. Grupos com configuração `menu.header` recebem um painel de expansão com header sticky.

Páginas com `menu.hidden` ficam de fora. Numa página fora de todos os books a árvore fica vazia: o menu mostra o branding e os links do topo, e a busca, que só filtra a árvore, fica desabilitada.

## Agrupamento de Itens

Itens são agrupados quando:

1. O primeiro item de um grupo de basepath tem `meta.menu.header` definido
2. Todos os itens subsequentes compartilhando o mesmo basepath são coletados no mesmo grupo

Itens sem header são exibidos como entradas únicas.

## Auto-Scroll

No mount e após navegação, o menu automaticamente faz scroll até o item ativo, centralizando-o no viewport com uma animação suave de 300ms. Quando um link do topo e um item da árvore apontam para a mesma página, o item da árvore é o centralizado.
