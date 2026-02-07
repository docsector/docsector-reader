## Visão Geral

`DPageSection` é o **motor de renderização Markdown** no coração do Docsector Reader. Ele tokeniza o source Markdown a partir do caminho i18n atual e renderiza cada token como o componente Vue apropriado.

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `id` | `Number` | Sim | ID base usado para geração de âncoras |

## Como Funciona

1. Lê o source Markdown do caminho da store i18n `_.&#123;absolute&#125;.source`
2. Faz o parse com **markdown-it** + **markdown-it-attrs**
3. Tokeniza o AST parseado em um array flat de tokens renderizáveis
4. Cada token é renderizado como o componente Docsector correspondente

## Tipos de Token e Renderização

| Markdown | Tag do Token | Componente |
|----------|-------------|-----------|
| `## Título 2` | `h2` | `DH2` |
| `### Título 3` | `h3` | `DH3` |
| `#### Título 4` | `h4` | `DH4` |
| `##### Título 5` | `h5` | `DH5` |
| `###### Título 6` | `h6` | `DH6` |
| Texto de parágrafo | `p` | `<p v-html>` |
| Lista não ordenada | `ul` | `<ul v-html>` |
| Lista ordenada | `ol` | `<ol v-html>` |
| Tabela | `table` | `<table v-html>` |
| Bloco de código cercado | `code` | `DPageSourceCode` |

## Suporte a Aninhamento

DPageSection lida com um nível de aninhamento para:

- Listas com marcadores (`ul > li`)
- Listas ordenadas (`ol > li`)
- Tabelas (`table > thead/tbody > tr > th/td`)

Conteúdo aninhado é acumulado em uma única string HTML e renderizado com `v-html`.

## Atributos Customizados

O plugin `markdown-it-attrs` usa `:` e `;` como delimitadores. Atualmente, apenas o atributo `filename` é utilizado:

```
:filename="servidor.php";
```

Este atributo é extraído de blocos de código cercados e passado ao `DPageSourceCode` para exibição.

## IDs de Âncora

Cada token de título recebe um ID de âncora calculado como `id + token.map[0]`, onde `token.map[0]` é o número da linha no source. Isso cria âncoras únicas e determinísticas para a árvore de ToC.
