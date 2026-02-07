## Visão Geral

`DPage` é o componente **container principal de página**. Ele fornece a área de scroll, a barra de submenu (abas Overview/Showcase/Vs), o drawer lateral de âncoras e o rodapé `DPageMeta`.

Toda página de documentação é renderizada dentro de uma instância de `DPage`.

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `disableNav` | `Boolean` | `false` | Oculta o rodapé de navegação DPageMeta |

## Estrutura do Template

DPage renderiza o seguinte layout:

- **QPageContainer** — Container de página Quasar
- **QToolbar** (submenu) — Navegação por abas: Overview, Showcase, Vs
- **QPage** com **QScrollArea** — Área de conteúdo com scroll e slot
- **QDrawer** (direita) — Árvore de navegação por âncoras/ToC

## Slot

O slot padrão recebe o conteúdo da página. Normalmente, `DSubpage` coloca `DH1` e `DPageSection` dentro deste slot:

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

## Abas de Sub-página

DPage lê a configuração `meta.subpages` da rota para determinar quais abas exibir:

- **Overview** — Sempre exibida quando outras abas existem
- **Showcase** — Exibida quando `subpages.showcase: true`
- **Vs** — Exibida quando `subpages.vs: true`

## Comportamento de Scroll

DPage reseta a posição de scroll nas mudanças de rota via `router.beforeEach`. O observador de scroll monitora a posição vertical e atualiza a seleção de âncora via composable `useNavigator`.

## Integração com Store

DPage lê e escreve em vários módulos da Vuex store:

- `layout/meta` — Controla a visibilidade do drawer de âncoras
- `page/base` — Caminho base da página atual
- `page/relative` — Caminho da sub-página (`/overview`, `/showcase`, `/vs`)
- `page/anchor` — Reseta âncoras na navegação
