## Visão Geral

Blocos de terminal embutem um terminal executável, ao vivo, dentro de páginas Markdown.

O bloco renderiza um terminal xterm.js com botão de execução, um seletor de comandos opcional, um painel de código-fonte e um indicador de status. O que de fato executa é fornecido pelo projeto através de um pequeno módulo de **engine** — o Docsector entrega a UI, o projeto entrega o runtime (um CLI em PHP-WASM, um simulador em JS, qualquer coisa que consiga transmitir texto).

O bloco é escrito com o elemento Markdown customizado `<d-block-terminal>`.

## Engines

Coloque os módulos de engine em `src/terminals/**/*.js` no projeto que usa o Docsector.

O Docsector descobre esses arquivos em tempo de build através do Vite. O valor de `engine` é normalizado para kebab-case, então este bloco:

```html
<d-block-terminal engine="demo-echo" title="Demo de echo" />
```

resolve este arquivo:

```text
src/terminals/demo-echo.js
```

Um módulo de engine exporta por padrão uma factory assíncrona e pode exportar um objeto `meta`:

```js
export const meta = { label: 'Meu CLI (WASM)', language: 'php' }

export default async function createEngine ({ onOutput, onError, onStatus }) {
  return {
    async run (command, { columns = 80, rows = 24 } = {}) {
      onOutput('chunk transmitido…') // escreve no terminal conforme os dados chegam
      return 0                       // resolve quando o comando termina
    },
    async source (command) {         // opcional: alimenta o painel de código-fonte
      return { text: '…', language: 'php', url: 'https://github.com/…' }
    },
    async stop () {},                // opcional: interrompe a execução atual (mostra um botão Stop)
    async dispose () {}              // opcional: teardown ao desmontar
  }
}
```

A factory em si deve ser barata: ela roda na montagem da página para que o painel de código-fonte e o botão Stop estejam disponíveis antes da primeira execução. Trabalho pesado — baixar um runtime, inicializar uma VM — pertence ao `run()`.

`onStatus(phase, detail)` aceita as fases `downloading`, `extracting`, `booting` e `running` — o bloco as converte em mensagens de status enquanto a engine prepara runtimes pesados.

## Carregamento Sob Demanda

Nada pesado carrega na renderização da página: o xterm.js e o módulo da engine são importados dinamicamente apenas quando o leitor clica em executar (ou quando o bloco fica visível, com `autorun="true"`). Engines devem seguir a mesma regra e buscar seu runtime (por exemplo, um `.wasm` de vários megabytes) dentro da primeira chamada a `run()`, reportando progresso via `onStatus`.

## Atributos

| Atributo | Propósito |
|----------|-----------|
| `engine` | Id da engine em `src/terminals/**/*.js` (obrigatório) |
| `title` | Título da barra; usa o `meta.label` da engine como fallback |
| `command` | Comando único passado ao `run()` da engine |
| `commands` | Seletor de comandos: pares `Rótulo:comando` separados por `\|` |
| `autorun` | Executa na primeira visibilidade quando definido como `true` |
| `height` | Altura do viewport do terminal, como `360` ou `420px` |
| `run-label` | Rótulo customizado para o botão de execução |

O conteúdo do elemento (entre as tags de abertura e fechamento) vira uma legenda renderizada como Markdown inline abaixo do terminal.

## Seletor de Comandos

`commands` renderiza uma linha de abas logo abaixo da barra de ferramentas. Cada entrada é `Rótulo:comando`, separada por `|`:

```html
<d-block-terminal
  engine="demo-echo"
  commands="Olá:echo Olá!|Docs:echo Docs ao vivo"
/>
```

Antes da primeira execução, escolher uma aba apenas a seleciona — o leitor continua no controle de quando o runtime é baixado. Após a primeira execução o runtime está aquecido, então trocar de aba executa o comando selecionado diretamente.

## Painel de Código-Fonte e Link do GitHub

Quando a engine implementa `source(command)`, o bloco mostra um toggle de código-fonte que renderiza o texto retornado com o renderizador padrão de blocos de código do Docsector. Se o objeto retornado tiver uma `url`, a ação do GitHub a abre.
