## Visão Geral

Page é o container principal da tela de documentação.

Ele fornece a área de scroll, a barra de subpáginas, o drawer lateral de índice e a área de navegação do rodapé. Na implementação, isso é sustentado por `DPage`.

Esta entrada do manual fica intencionalmente só com overview, porque o comportamento do container é mais fácil de explicar do que de demonstrar isoladamente.

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `disableNav` | `Boolean` | `false` | Oculta o rodapé de navegação DPageMeta |
| `showBackToTopControl` | `Boolean` | `false` | Habilita o controle flutuante de voltar ao topo com progresso circular de leitura |

## Estrutura do Layout

Uma page fornece as seguintes partes de layout:

- **QPageContainer** — Container de página Quasar
- **QToolbar** (submenu) — Navegação por abas: Overview, Showcase, Vs
- **QPage** com **QScrollArea** — Área de conteúdo com scroll e slot
- **QDrawer** (direita) — Árvore de navegação por âncoras/ToC

## Slot de Conteúdo

O slot padrão recebe o conteúdo da página. Na documentação roteada, uma subpage normalmente coloca o título e as seções renderizadas dentro desse slot:

```html
<d-page>
  <header>
    <d-h1 :id="0" />
  </header>
  <main>
    <d-page-section :id="sectionId" />
  </main>
</d-page>
```

## Abas de Subpágina

O container de page lê a configuração `meta.subpages` da rota para determinar quais abas exibir:

- **Overview** — Sempre exibida quando outras abas existem
- **Showcase** — Exibida quando `subpages.showcase: true`
- **Vs** — Exibida quando `subpages.vs: true`

## Comportamento de Scroll

O container de page reseta a posição de scroll nas mudanças de rota via `router.beforeEach`. O observador de scroll monitora a posição vertical e atualiza a seleção de âncora via composable `useNavigator`.

Quando `showBackToTopControl` está habilitada, a page também deriva o progresso de leitura a partir da mesma área de scroll. O controle flutuante fica oculto no topo, aparece após uma pequena rolagem, exibe progresso circular e retorna para a âncora `0` ao ser clicado.

## Integração com Store

A implementação lê e escreve em vários módulos da Vuex store:

- `layout/meta` — Controla a visibilidade do drawer de âncoras
- `page/base` — Caminho base da página atual
- `page/relative` — Caminho da sub-página (`/overview`, `/showcase`, `/vs`)
- `page/anchor` — Reseta âncoras na navegação
