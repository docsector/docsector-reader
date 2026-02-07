## Visão Geral

`useNavigator` é o **composable central** que gerencia navegação por âncora, registro de títulos, rastreamento de scroll e construção da árvore de ToC. É usado por DH1–DH6, DPage e DPageAnchor.

## API Retornada

```javascript
const &#123;
  register,   // Registrar ID de âncora
  index,       // Adicionar nó à árvore de ToC
  select,      // Selecionar uma âncora
  anchor,      // Fazer scroll até uma âncora
  scrolling,   // Handler de evento de scroll
  navigate,    // Navegar para uma âncora (URL + scroll)
  selected     // Ref para âncora atualmente selecionada
&#125; = useNavigator()
```

## Funções

### register(id)

Registra um ID de âncora no array `page/anchors` do store. Chamado por componentes de título no mount.

```javascript
onMounted(() => &#123;
  register(props.id)
&#125;)
```

### index(id, child)

Insere um nó no store `page/nodes` para construir a árvore de ToC. Chamado por DH2–DH6 após renderização.

### select(id)

Atualiza o estado `page/anchor` e expande o nó correspondente na árvore.

### anchor(id, toSelect)

Faz scroll do viewport até o elemento DOM com o ID fornecido usando o utilitário `scroll` do Quasar. Opcionalmente chama `select()` para destacar o nó na árvore de ToC.

### scrolling(scroll)

O handler de evento de scroll attached ao QScrollObserver do DPage. Itera sobre todas as âncoras registradas, encontra a mais próxima da posição de scroll atual e a seleciona. Só está ativo quando `page/scrolling` é `true`.

### navigate(value, toAnchor)

Função de navegação completa que:

1. Atualiza o hash da URL via `router.push()`
2. Faz scroll até o elemento da âncora
3. Trata diferenças de timing entre desktop e mobile

## Padrão de Uso

Componentes de título usam register + index:

```javascript
const &#123; register, index, navigate, selected &#125; = useNavigator()

onMounted(() => &#123;
  register(props.id)
  selected.value = props.value
  index(props.id)
&#125;)
```

DPage usa scrolling:

```javascript
const &#123; scrolling, navigate &#125; = useNavigator()
// scrolling é passado ao QScrollObserver
```

DPageAnchor usa navigate + anchor:

```javascript
const &#123; navigate, anchor, selected &#125; = useNavigator()
// navigate é disparado pela seleção do QTree
```

## Dependências de Store

- `page/anchors` — Array de IDs de âncora registrados
- `page/nodes` — Estrutura em árvore do ToC
- `page/nodesExpanded` — Nós expandidos da árvore
- `page/anchor` — Âncora atualmente selecionada
- `page/scrolling` — Se o rastreamento de scroll está ativo
