## Visão Geral

O Docsector Reader usa **Vuex 4** para gerenciamento de estado com 5 módulos namespaced. Como o `@quasar/app-vite` v2 removeu o suporte embutido ao Vuex, a store é registrada manualmente via `src/boot/store.js`.

## Módulos

### App (`src/store/App.js`)

Trata o mapeamento de rota para caminho i18n.

**Actions:**

| Action | Descrição |
|--------|-----------|
| `configureLanguage(routeMatched)` | Converte caminhos de rota para caminhos i18n e faz commit nos módulos page/i18n |

### I18n (`src/store/I18n.js`)

Rastreia os caminhos de namespace i18n atuais.

**State:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `base` | `String` | Caminho base i18n (ex: `'guide.getting-started'`) |
| `relative` | `String` | Caminho relativo i18n (ex: `'overview'`) |
| `absolute` | `String` | Caminho completo i18n (ex: `'guide.getting-started.overview'`) |

### Page (`src/store/Page.js`)

Gerencia estado de navegação de página, âncoras e árvore de ToC.

**State Principal:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `base` | `String` | Caminho base da rota |
| `relative` | `String` | Caminho relativo da sub-página |
| `anchor` | `Number` | ID da âncora atualmente selecionada |
| `anchors` | `Array` | IDs de âncora registrados |
| `scrolling` | `Boolean` | Se o rastreamento de scroll está ativo |

**Getters Principais:**

| Getter | Descrição |
|--------|-----------|
| `nodes` | Estrutura em árvore do ToC para DPageAnchor |
| `nodesExpanded` | Array de IDs de nós expandidos |

### Layout (`src/store/Layout.js`)

Controla estados de visibilidade do layout.

**State Principal:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `meta` | `Boolean` | Visibilidade do drawer direito (painel de âncoras) |
| `metaToggle` | `Boolean` | Se o botão toggle de meta está ativo |
| Posições grid | `Object` | Estado de posição para elementos grid do layout |

### Settings (`src/store/Settings.js`)

Gerencia o estado do diálogo de configurações.

**State:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `dialog` | `Boolean` | Estado aberto/fechado do diálogo de configurações |

**Getter/Mutation:**

| Nome | Descrição |
|------|-----------|
| `dialog` (getter) | Retorna estado do diálogo |
| `dialog` (mutation) | Define estado do diálogo |

## Boot File

A store é registrada em `src/boot/store.js`:

```javascript
import &#123; boot &#125; from 'quasar/wrappers'
import store from '../store'

export default boot(async (&#123; app &#125;) => &#123;
  app.use(store)
&#125;)
```

Este boot file **deve** ser listado primeiro em `quasar.config.js`:

```javascript
boot: ['store', 'QZoom', 'i18n', 'axios']
```
