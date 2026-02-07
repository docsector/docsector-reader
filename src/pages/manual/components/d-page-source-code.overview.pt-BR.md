## Visão Geral

`DPageSourceCode` renderiza **blocos de código cercados** com syntax highlighting, números de linha, funcionalidade de copiar para clipboard e exibição opcional de nome de arquivo. Usa **Prism.js** para highlighting.

## Props

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `index` | `Number` | Sim | — | Índice único para geração de âncora |
| `language` | `String` | Não | `'html'` | Linguagem de programação para highlighting |
| `text` | `String` | Sim | — | Texto de código bruto para exibir |
| `filename` | `String` | Não | `''` | Nome de arquivo opcional exibido na barra de info |

## Linguagens Suportadas

Por padrão, DPageSourceCode suporta:

- **PHP** — via `prismjs/components/prism-php`
- **Bash** — via `prismjs/components/prism-bash`
- **HTML** — suporte embutido do Prism
- **JavaScript** — suporte embutido do Prism

Para adicionar mais linguagens, importe componentes adicionais do Prism em `DPageSourceCode.vue`.

## Funcionalidades

### Syntax Highlighting

O código é destacado em tempo de renderização usando `Prism.highlight()`. O HTML destacado é injetado via `v-html` em um elemento `<code>`.

### Números de Linha

Quando o bloco de código tem mais de 1 linha, números de linha são exibidos no lado esquerdo. Cada número de linha é um link de âncora clicável.

### Copiar para Clipboard

Um botão de cópia aparece na barra de info. Quando clicado, seleciona o conteúdo do código e copia para o clipboard usando `document.execCommand('copy')`.

### Exibição de Nome de Arquivo

Quando a prop `filename` é fornecida (extraída do atributo Markdown `:filename;`), ela aparece na barra de info junto com o identificador de linguagem.

## Tema Escuro/Claro

DPageSourceCode tem esquemas de cores completamente separados para:

- **Modo claro** (classe `.white`) — Cores de sintaxe tradicionais claras
- **Modo escuro** (classe `.dark`) — Fundo escuro com cores vibrantes de token

O esquema de cores é selecionado automaticamente baseado em `$q.dark.isActive`.

## Sistema de Âncoras

Cada bloco de código recebe uma âncora baseada em letras (A, B, C, ..., Z, AA, AB, ...) gerada a partir do seu índice. Números de linha dentro do bloco são adicionados a esta âncora (ex: `#A1`, `#A2`).
