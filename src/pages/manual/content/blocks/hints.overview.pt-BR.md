## Visão Geral

Hints são blocos de alerta no estilo GitHub renderizados a partir de blockquotes Markdown com marcador `[!TYPE]`.

Use esse bloco quando o conteúdo precisar ser lido como nota, dica, aviso ou outro callout semântico.

Para texto citado de forma neutra, sem estilo de alerta, veja [Quote](/manual/content/blocks/quotes/overview/).

## Sintaxe em Markdown

```markdown
> [!WARNING]
> Esta operação pode interromper workers.
```

## Marcadores Suportados

| Marcador | Quando usar |
|----------|-------------|
| `NOTE` | Contexto extra ou material de apoio |
| `TIP` | Conselho prático ou boa prática |
| `IMPORTANT` | Informação crítica que não pode passar despercebida |
| `WARNING` | Armadilhas, ações arriscadas ou breaking changes |
| `CAUTION` | Ações de alto risco que merecem cuidado extra |

## Observações

- O marcador deve aparecer na primeira linha do blockquote.
- O corpo do hint ainda pode conter parágrafos, listas, blocos de código e matemática.
- Marcadores desconhecidos voltam para o comportamento de uma citação comum.
