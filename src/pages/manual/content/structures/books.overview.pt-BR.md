## Visão Geral

Books definem as seções principais da documentação exibidas como abas de primeiro nível, como Manual e Guide.

Um book é configurado em um arquivo `*.book.js`. Ele não é um componente Vue e não renderiza conteúdo de página por conta própria.

## Exemplo

```javascript
import { defineBook } from '../index.js'

export default defineBook({
  id: 'manual',
  label: 'Manual',
  icon: 'menu_book',
  order: 1,
  color: {
    active: 'white',
    inactive: 'white'
  }
})
```

## O Que um Book Controla

- O rótulo da aba exibida na navegação principal
- O ícone usado nessa aba
- A ordem das seções de primeiro nível
- As cores ativa e inativa da aba
- O id estável referenciado pelos registries de páginas

## Observações

- Use um arquivo `*.book.js` para cada seção de primeiro nível.
- Registries como `manual.index.js` e `guide.index.js` associam entradas a um book com o campo `book`.
- Um book agrupa páginas sob a mesma aba e o mesmo prefixo de rota.