## Visão Geral

`DPageSourceCode` renderiza **blocos de código cercados** com syntax highlighting, números de linha, funcionalidade de copiar para clipboard, exibição opcional de nome de arquivo, abas e breadcrumbs. Usa **Prism.js** para highlighting.

## Props

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `index` | `Number` | Sim | — | Índice único para geração de âncora |
| `language` | `String` | Não | `'html'` | Linguagem de programação para highlighting |
| `text` | `String` | Não | `''` | Texto de código bruto para exibir no modo simples |
| `filename` | `String` | Não | `''` | Nome de arquivo opcional exibido na barra de info |
| `breadcrumbs` | `Array` | Não | `[]` | Segmentos de breadcrumb exibidos acima do bloco de código |
| `tabs` | `Array` | Não | `[]` | Itens de aba com label, linguagem, texto e breadcrumbs |

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

Um botão de cópia aparece na barra de info. Quando clicado, seleciona o conteúdo de código atual e copia para o clipboard usando `document.execCommand('copy')`.

### Abas

Blocos de código cercados consecutivos com o mesmo atributo `group` são renderizados como abas. Cada bloco pode definir seu rótulo visível com `tab`; use esse rótulo como nome do arquivo quando o grupo deve parecer abas de editor.

### Breadcrumbs

Quando um atributo `breadcrumb` é fornecido, ele é renderizado acima do bloco de código. Use `>` entre segmentos, como `src > components > DPageSourceCode.vue`.

### Ícones de Arquivo

Labels de abas que parecem nomes de arquivo, como `App.vue`, recebem um ícone do Material Icon Theme inline antes do texto. Breadcrumbs adicionam o mesmo ícone apenas ao segmento final quando esse segmento parece um nome de arquivo.

### Exibição de Nome de Arquivo

Quando a prop `filename` é fornecida (extraída do atributo Markdown `:filename;`), ela aparece na barra de info junto com o identificador de linguagem.

## Tema Escuro/Claro

DPageSourceCode tem esquemas de cores completamente separados para:

- **Modo claro** (classe `.white`) — Cores de sintaxe tradicionais claras
- **Modo escuro** (classe `.dark`) — Fundo escuro com cores vibrantes de token

O esquema de cores é selecionado automaticamente baseado em `$q.dark.isActive`.

## Sistema de Âncoras

Cada bloco de código recebe uma âncora baseada em letras (A, B, C, ..., Z, AA, AB, ...) gerada a partir do seu índice. Números de linha dentro do bloco são adicionados a esta âncora (ex: `#A1`, `#A2`).
