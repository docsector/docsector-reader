## Visão Geral

`DPageAnchor` renderiza a **árvore de Índice (ToC)** no drawer lateral direito. Exibe uma árvore navegável de todos os títulos na página atual, permitindo que os usuários saltem diretamente para qualquer seção.

## Como Funciona

1. Conforme cada componente de título (DH1–DH6) é montado, ele se registra no store `page/nodes` via `useNavigator`
2. `DPageAnchor` lê o getter `page/nodes` para renderizar a árvore
3. Quando o usuário faz scroll, o observador de scroll no `DPage` atualiza a âncora selecionada
4. Clicar em um nó da árvore navega até o título correspondente

## Integração com Store

DPageAnchor interage com estes estados/getters da store:

- `page/nodes` — A estrutura em árvore dos títulos
- `page/nodesExpanded` — Quais nós da árvore estão expandidos
- `page/anchor` — ID do título atualmente selecionado
- `layout/metaToggle` — Controla visibilidade do drawer

## Renderização da Árvore

Usa o componente `QTree` do Quasar com `default-expand-all`. A chave do nó é o `id` numérico do título, e o label é o texto do título.

O nó raiz (do DH1) mostra o título da página do i18n quando nenhum label é definido:

```html
<template v-slot:default-header="props">
  <b v-if="props.node.label">
    &#123;&#123; props.node.label &#125;&#125;
  </b>
  <b v-else>
    &#123;&#123; $t('_.' + $store.state.i18n.base + '._') &#125;&#125;
  </b>
</template>
```

## Sincronização de Scroll

Quando o usuário faz scroll no conteúdo da página, o observador de scroll do `DPage` chama `useNavigator().scrolling()`, que itera sobre as âncoras registradas e seleciona a mais próxima da posição de scroll atual. Isso mantém a árvore de ToC sincronizada com o conteúdo visível.

## Ciclo de Vida

- **onMounted** — Habilita toggle de meta, inicia rastreamento de scroll após 1s de delay, ancora no hash da URL se presente
- **onBeforeUnmount** — Reseta âncoras, nós e desabilita rastreamento de scroll

## Estilização

A árvore usa a estilização padrão de árvore do Quasar com cores customizadas para modos claro/escuro. Nós selecionados recebem fundo com a cor primária. O texto dos títulos é exibido em negrito a 15px.
