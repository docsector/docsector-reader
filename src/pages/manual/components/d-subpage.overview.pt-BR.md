## Visão Geral

`DSubpage` é um **wrapper de conveniência** que compõe `DPage`, `DH1` e `DPageSection` em um layout de página de documentação padrão. É o componente carregado pelo roteador para cada rota de sub-página.

## Como Funciona

DSubpage gera um ID numérico determinístico a partir do caminho da rota atual usando uma função hash. Esse ID é passado ao `DPageSection` para manter estáveis os índices internos do renderer em cada página.

## Template

```html
<d-page show-back-to-top-control>
  <header>
    <d-h1 :id="0" />
  </header>
  <main>
    <d-page-section :id="id" />
  </main>
</d-page>
```

## Geração de ID

A propriedade computada `id` cria um hash consistente a partir do caminho da rota:

```javascript
const id = computed(() => &#123;
  const path = route.path
  let hash = 5381
  for (let i = 0; i < path.length; i++) &#123;
    hash = (hash * 33) ^ path.charCodeAt(i)
  &#125;
  return hash >>> 0
&#125;)
```

Isso mantém o estado interno do renderer isolado ao navegar entre páginas. Os headings Markdown em si usam slugs compatíveis com GitHub derivados do texto do título, então links de Table of Contents no estilo README continuam funcionando.

## Quando Usar

DSubpage é usado automaticamente pelo roteador para todas as páginas de documentação. Você não precisa usá-lo diretamente, a menos que crie layouts de página customizados. Para documentação padrão, o roteador cuida de tudo:

```javascript
// Em routes.js - isso acontece automaticamente
&#123;
  path: 'overview',
  component: () => import('components/DSubpage.vue'),
  meta: &#123; status: config.status &#125;
&#125;
```

## Relação com DPage

- `DSubpage` **usa** `DPage` como container
- `DPage` cuida do layout (scroll, toolbar, drawer)
- `DSubpage` cuida da composição de conteúdo (H1 + seções)

## Controle Integrado de Voltar ao Topo

As sub-páginas de documentação roteadas habilitam automaticamente o controle flutuante de voltar ao topo do DPage. O controle só é exibido quando o conteúdo realmente tem overflow, fica visível após uma pequena rolagem do leitor e mostra o progresso atual de leitura com um indicador circular.
