## Visão geral

Blocos de exemplos de código renderizam SFCs Vue do projeto como previews ao vivo dentro das páginas Markdown.

Eles são úteis quando a documentação precisa mostrar o comportamento real de um componente e ainda permitir que leitores inspecionem o código fonte exato por trás do preview.

O bloco é escrito com o elemento Markdown customizado `<d-block-code-example>`.

## Arquivos de exemplo

Coloque os componentes de exemplo em `src/examples/**/*.vue` no projeto que usa o Docsector.

O Docsector descobre esses arquivos durante o build com Vite. O valor de `src` é normalizado para kebab-case, então este bloco:

```html
<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter" />
```

resolve este arquivo:

```text
src/examples/manual/code-examples/BasicCounter.vue
```

Também é possível usar `file` no lugar de `src` ao migrar exemplos inspirados nos padrões do Quasar Docs.

## Atributos

| Atributo | Finalidade |
|----------|------------|
| `src` | Id do exemplo dentro de `src/examples/**/*.vue` |
| `file` | Alias de `src` |
| `title` | Título exibido acima do preview |
| `expanded` | Abre o painel de fonte por padrão quando definido como `true` |
| `codepen` | Mostra a ação do CodePen, exceto quando definido como `false` |
| `scrollable` | Dá ao preview uma altura fixa com rolagem |
| `overflow` | Permite overflow horizontal e vertical no preview |
| `height` | Define uma altura customizada para o preview, como `360` ou `420px` |

## Painel de fonte

O botão de fonte abre o SFC Vue dividido em abas Template, Script, Style e All quando essas seções existem.

O painel reutiliza o renderizador padrão de blocos de código do Docsector, então leitores recebem syntax highlighting, suporte a cópia e o mesmo tratamento visual em temas claro e escuro.

## Link de fonte no GitHub

O botão do GitHub abre o SFC do exemplo no repositório do projeto quando o Docsector consegue derivar a URL a partir de `github.editBaseUrl` ou `links.github` em `docsector.config.js`.

## Exportação para CodePen

O botão do CodePen fica disponível quando o código pode ser transformado com segurança para uma demo somente no navegador.

A primeira implementação suporta SFCs Vue simples com template, style opcional e script Options API com `export default`. Imports nomeados de `vue` e `quasar` são convertidos para globais do navegador. Exemplos que usam `<script setup>`, scripts TypeScript ou imports locais continuam renderizando no Docsector, mas a ação do CodePen fica desativada.

Use `codepen="false"` quando um exemplo intencionalmente não deve ser exportado.