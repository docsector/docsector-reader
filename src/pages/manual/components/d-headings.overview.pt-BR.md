## Visão Geral

`DH1` até `DH6` são **componentes de título** que renderizam títulos de seção com suporte a navegação por âncora. Cada nível de título corresponde a um heading Markdown (`##` até `######`).

## Hierarquia de Componentes

| Componente | Markdown | HTML | Uso |
|------------|----------|------|-----|
| `DH1` | `#` (implícito) | `<h1>` | Título da página, gerado automaticamente do i18n |
| `DH2` | `##` | `<h2>` | Seções principais |
| `DH3` | `###` | `<h3>` | Sub-seções |
| `DH4` | `####` | `<h4>` | Seções de detalhe |
| `DH5` | `#####` | `<h5>` | Seções menores |
| `DH6` | `######` | `<h6>` | Micro seções |

## DH1 — Título da Página

DH1 é especial — não recebe conteúdo via props. Em vez disso, lê o título da página da store i18n:

```javascript
const heading = computed(() => &#123;
  const base = store.state.i18n.base
  return t('_.' + base + '._')
&#125;)
```

DH1 também se **registra** como âncora `0` no composable `useNavigator`, permitindo que a árvore de ToC mostre o título da página como nó raiz.

## DH2–DH6 — Títulos de Seção

Esses componentes recebem seu conteúdo via prop `value` (já renderizado como HTML pelo `DPageSection`):

## Props (DH2–DH6)

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `id` | `Number` | Sim | ID da âncora para navegação |
| `value` | `String` | Sim | Conteúdo HTML do título |

## Navegação por Âncora

Clicar em qualquer título dispara a função `navigate(id)` do `useNavigator`, que:

1. Atualiza o hash da URL para `#&#123;id&#125;`
2. Faz scroll do viewport até o elemento do título
3. Destaca o título na árvore de ToC

## Registro de Nós

Cada componente de título (DH2+) chama `useNavigator().index(id)` no mount e update, que insere um nó no store `page/nodes`, construindo a árvore de ToC dinamicamente conforme a página renderiza.

## Estilização

Os títulos usam elementos HTML de heading padrão com renderização `v-html`. Estilos customizados podem ser aplicados através do arquivo global `app.sass` ou direcionando as tags de heading diretamente.
