## Visão Geral

`DPageBlockquote` renderiza **blockquotes estilizados** com categorização semântica. Suporta três tipos de mensagem: important, warning e note — cada um com um label visual distinto.

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `message` | `String` | `''` | Tipo de blockquote: `'important'`, `'warning'` ou `'note'` |

## Slot

O slot padrão recebe o conteúdo do blockquote.

## Tipos de Mensagem

| Tipo | Label | Propósito |
|------|-------|-----------|
| `important` | **Important** | Informação crítica que o leitor precisa saber |
| `warning` | **Warning** | Armadilhas potenciais ou breaking changes |
| `note` | **Note** | Contexto adicional ou dicas |
| (vazio) | *(nenhum)* | Blockquote genérico sem label |

## Uso

DPageBlockquote não é atualmente auto-renderizado pelo DPageSection a partir de blockquotes Markdown. Para usá-lo, inclua-o diretamente em um componente customizado:

```html
<d-page-blockquote message="important">
  <p>Esta é uma informação criticamente importante.</p>
</d-page-blockquote>

<d-page-blockquote message="warning">
  <p>Tenha cuidado com esta operação!</p>
</d-page-blockquote>

<d-page-blockquote message="note">
  <p>Esta é uma dica opcional para usuários avançados.</p>
</d-page-blockquote>
```

## Estilização

O componente renderiza um elemento `<blockquote>` padrão. O label `<strong>` é exibido condicionalmente baseado na prop `message`. Customize a aparência no seu `app.sass` global ou direcionando `blockquote` no seu CSS.
