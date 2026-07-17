## Modo Automático, Escuro e Claro

O Docsector Reader oferece três modos de tema — **Automático**, **Claro** e **Escuro** — selecionáveis no diálogo de Configurações. **Automático é o padrão**: o site segue o esquema de cores do sistema operacional do leitor e muda ao vivo quando essa configuração muda, sem recarregar.

A escolha é guardada no `localStorage` sob `setting.theme` e aplicada antes da primeira pintura, então o leitor nunca vê um flash do tema errado. A renderização é feita pelo **Quasar Dark Plugin** através das classes `body--light` / `body--dark` descritas abaixo — nenhuma configuração é necessária.

Veja [Tema](/manual/basic/theme) para entender como a detecção e a persistência funcionam.

## Variáveis Quasar

As cores do tema são definidas em `src/css/quasar.variables.scss`:

```css
$primary: #027BE3;
$secondary: #26A69A;
$accent: #9C27B0;
$dark: #1D1D1D;
$dark-page: #121212;
$positive: #21BA45;
$negative: #C10015;
$info: #31CCEC;
$warning: #F2C037;
```

Sobrescreva essas variáveis para customizar todo o esquema de cores.

## Estilos Globais

Os estilos globais ficam em `src/css/app.sass`. Este arquivo é carregado automaticamente pelo Quasar e se aplica a todas as páginas.

## Estilos a Nível de Componente

Cada componente Docsector tem seu próprio bloco `style` com escopo usando SASS. Variantes de modo escuro/claro usam o padrão de seletor CSS:

```css
body.body--dark
  .meu-elemento
    color: white

body.body--light
  .meu-elemento
    color: black
```

## Variáveis CSS

Os componentes usam propriedades CSS customizadas para estilização consciente do tema:

- `--d-menu-subheader-txt-color` — Cor do texto de subheader do menu
- `--d-menu-expansion-bg-color` — Cor de fundo do painel de expansão do menu
- `--d-menu-item-opacity` — Opacidade do hover de itens do menu

## Customizando Cores dos Blocos de Código

O componente `DBlockSourceCode` tem esquemas de cores separados para modos claro e escuro, usando classes de token do Prism.js. Sobrescreva as classes `token.*` no bloco SASS `.source-code` para customizar as cores de syntax highlighting.

## Famílias de Fontes

Os blocos de código usam `"Fira Code Nerd Font"` com `"Consolas"` como fallback. Para usar uma fonte monospace diferente, sobrescreva as declarações font-family de `.source-code`.
