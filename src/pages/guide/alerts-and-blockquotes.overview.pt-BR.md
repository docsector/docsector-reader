# Alertas e Blockquotes

O Docsector suporta blockquotes no estilo de alertas do GitHub e blockquotes comuns.

## Sintaxe de alerta do GitHub

Use esta sintaxe no Markdown:

```markdown
> [!CAUTION]
> AVISO DE MUDANCA QUEBRANDO COMPATIBILIDADE.
>
> A partir da versao 7.0.0, varias breaking changes foram introduzidas.
```

Tipos de alerta suportados:

- `NOTE`
- `TIP`
- `IMPORTANT`
- `WARNING`
- `CAUTION`

## Exemplos de alerta

### Note

> [!NOTE]
> Este e um contexto adicional que ajuda o leitor a entender a secao atual.

### Tip

> [!TIP]
> Voce pode manter os exemplos curtos e focados para melhorar a legibilidade.

### Important

> [!IMPORTANT]
> Esta migracao altera defaults e deve ser revisada antes do deploy.

### Warning

> [!WARNING]
> Esta acao pode interromper workers em execucao em producao.

### Caution

> [!CAUTION]
> Faça backup do ambiente antes de aplicar esta atualizacao.
>
> Veja `docs/migration.md` para o checklist completo.

## Blockquote comum

Se nao houver marcador `[!TYPE]`, o blockquote sera renderizado como blockquote comum:

> Este e um blockquote comum.
>
> Ele continua suportando **texto em negrito**, [links](https://github.com/docsector/docsector-reader) e `inline code`.

## Observacoes

- Marcadores de alerta sao case-insensitive (`[!note]` tambem funciona).
- Marcadores desconhecidos sao tratados como blockquote comum.
- Alertas e blockquotes comuns funcionam no modo claro e escuro.
