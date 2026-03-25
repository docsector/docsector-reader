## Visão Geral

`DPageBlockquote` renderiza **blockquotes estilizados** com categorização semântica. Agora ele atende tanto:

- Alertas no estilo GitHub vindos do Markdown (`> [!TYPE]`)
- Blockquotes comuns (`> ...`) sem marcador de alerta

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `message` | `String` | `''` | Tipo de alerta: `'note'`, `'tip'`, `'important'`, `'warning'` ou `'caution'` |

## Slot

O slot padrão recebe o conteúdo do blockquote.

## Tipos de Mensagem

| Tipo | Label | Propósito |
|------|-------|-----------|
| `note` | **Note** | Contexto adicional e referências |
| `tip` | **Tip** | Recomendação prática ou boa prática |
| `important` | **Important** | Informação crítica que o leitor precisa saber |
| `warning` | **Warning** | Armadilhas potenciais ou breaking changes |
| `caution` | **Caution** | Ação de alto risco que exige cuidado extra |
| (vazio) | *(nenhum)* | Blockquote genérico sem label |

## Uso

Sintaxe de alerta GitHub no Markdown:

```markdown
> [!WARNING]
> Esta operação pode interromper workers.
```

Sintaxe de blockquote comum no Markdown:

```markdown
> Este é um blockquote comum.
```

Você também pode usar o componente diretamente:

```html
<d-page-blockquote message="note">
  <p>Este é um contexto adicional.</p>
</d-page-blockquote>

<d-page-blockquote message="tip">
  <p>Esta é uma recomendação prática.</p>
</d-page-blockquote>

<d-page-blockquote message="warning">
  <p>Tenha cuidado com esta operação!</p>
</d-page-blockquote>

<d-page-blockquote message="caution">
  <p>Este é um aviso de alto risco.</p>
</d-page-blockquote>
```

## Estilização

O componente renderiza um elemento `<blockquote>` padrão com classes específicas quando `message` é informado. A aparência é controlada no `app.sass` global, incluindo variações para modo claro/escuro por tipo de alerta.
