## Showcase

### Comando Único

Este terminal executa a engine embutida `demo-echo` que acompanha o Docsector Reader.

<d-block-terminal engine="demo-echo" title="Demo de echo" command="echo Olá, Docsector!">
Clique em executar — a engine transmite saída colorida em ANSI para o terminal, caractere por caractere.
</d-block-terminal>

### Seletor de Comandos

Use `commands` para oferecer vários comandos em um único terminal.

<d-block-terminal
  engine="demo-echo"
  title="Demo de echo — seletor"
  commands="Olá:echo Olá, Docsector!|Terminais:echo Terminais ao vivo|Streaming:echo Transmitindo saída ANSI"
  height="300"
>
Escolha um comando na linha de abas e execute. O botão de código-fonte mostra o que a engine expõe para o comando selecionado.
</d-block-terminal>

### Entrada Interativa

Quando a engine implementa `input(data)`, o terminal captura o teclado após um clique dentro dele. `Ctrl+C` interrompe a execução como o botão Stop.

<d-block-terminal engine="demo-echo" title="Demo de echo — interativo" command="read" height="260">
Execute, clique no terminal e digite — a engine ecoa cada tecla e termina no Enter.
</d-block-terminal>

## Sintaxe de Escrita

```html
<d-block-terminal engine="demo-echo" title="Demo de echo" command="echo Olá, Docsector!">
Legenda opcional renderizada como Markdown inline.
</d-block-terminal>

<d-block-terminal
  engine="demo-echo"
  title="Demo de echo — seletor"
  commands="Olá:echo Olá, Docsector!|Terminais:echo Terminais ao vivo"
  height="300"
/>
```

## Recursos Visíveis Acima

- **Carregamento sob demanda** — o xterm.js e a engine carregam na primeira execução, não na renderização da página
- **Saída em streaming** — os chunks são escritos no terminal conforme a engine os emite
- **Suporte a ANSI** — cores, sobrescritas com `\r` e sequências de cursor renderizam nativamente
- **Seletor de comandos** com pares `Rótulo:comando` separados por `|` — ancorável via `?t<index>` (o F5 restaura a aba)
- **Entrada interativa** — encaminhamento de teclado com clique para focar via hook `input()` da engine, `Ctrl+C` = Stop
- **Painel de código-fonte** alimentado pelo hook `source()` da engine
- **Legenda em Markdown inline** abaixo do terminal
