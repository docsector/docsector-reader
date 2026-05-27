## Visão Geral

Subpage é a tela roteada padrão da documentação que compõe o container de page, o título da página e as seções renderizadas.

Na implementação, a documentação roteada usa `DSubpage` para essa composição.

## Como Funciona

A implementação gera um ID numérico determinístico a partir do caminho da rota atual usando uma função hash. Esse ID é passado ao `DPageSection` para manter estáveis os índices internos do renderer em cada página.

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

Subpage é usada automaticamente pelo roteador nas rotas padrão de documentação. Você normalmente não precisa montá-la manualmente, a menos que esteja criando um layout customizado.

```javascript
// Em routes.js - isso acontece automaticamente
&#123;
  path: 'overview',
  component: () => import('components/DSubpage.vue'),
  meta: &#123; status: config.status &#125;
&#125;
```

## Relação com Page

- Subpage usa o container de page como casca de layout
- Page cuida do comportamento de scroll, toolbar e drawer
- Subpage cuida da composição de título e seções

## Controle Integrado de Voltar ao Topo

As subpáginas roteadas habilitam automaticamente o controle flutuante de voltar ao topo. O controle só é exibido quando o conteúdo realmente tem overflow, fica visível após uma pequena rolagem do leitor e mostra o progresso atual de leitura com um indicador circular.
