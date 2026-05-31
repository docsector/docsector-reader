## Visão Geral

O book Full é um exemplo funcional de opt-in de layout no nível do book. Ele usa `layout: 'fullwidth'` em `src/pages/full.book.js`, então toda página registrada em `src/pages/full.index.js` herda o chrome de página fullwidth.

Esta página deve renderizar com o header global e as abas de books, mas sem a sidebar esquerda, sem a toolbar de subpáginas, sem o botão de Table of Contents e sem a área lateral do Table of Contents.

## Configuração do Book

```javascript
import { defineBook } from '../index.js'

export default defineBook({
  id: 'full',
  label: 'Full',
  icon: 'fullscreen',
  order: 3,
  layout: 'fullwidth'
})
```

O campo `layout` aceita dois valores:

- `default` mantém o chrome padrão de documentação.
- `fullwidth` mantém o header global e as abas de books, depois remove a sidebar do book, a toolbar de subpáginas e o Table of Contents das páginas desse book.

## Quando Usar

Use um book fullwidth quando uma seção precisa de mais liberdade do que uma página de referência, como:

- Páginas de visão geral de produto
- Seções de documentação com estilo de landing page
- Páginas ricas movidas por Vue
- Guias visuais com screenshots ou diagramas largos
- Experiências de documentação que não devem ficar limitadas por uma sidebar e um Table of Contents

## Comparação com a Homepage

O fullwidth da homepage é configurado separadamente em `docsector.config.js`:

```javascript
export default {
  homePage: {
    source: 'local',
    layout: 'fullwidth'
  }
}
```

Essa configuração é opt-in apenas para a homepage. Um `layout: 'fullwidth'` no nível do book é opt-in para todas as páginas desse book.