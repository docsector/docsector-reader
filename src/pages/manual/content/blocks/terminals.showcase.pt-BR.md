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
- **Seletor de comandos** com pares `Rótulo:comando` separados por `|`
- **Painel de código-fonte** alimentado pelo hook `source()` da engine
- **Legenda em Markdown inline** abaixo do terminal
