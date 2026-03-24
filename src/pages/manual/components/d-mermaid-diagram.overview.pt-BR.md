## Visão geral

O `DMermaidDiagram` é um componente interno responsável por renderizar diagramas **Mermaid**. Ele intercepta os blocos de código marcados com o indicador de linguagem `mermaid` e os renderiza como elementos SVG ao invés de texto puro.

O componente utiliza _lazy-loading_ — a biblioteca `mermaid` apenas é baixada quando de fato existe um diagrama na página, mantendo o tamanho inicial do site otimizado.

## Props

| Prop | Tipo | Obrigatório | Valor padrão | Descrição |
|------|------|----------|---------|-------------|
| `content` | `String` | Sim | — | A sintaxe pura da definição do Mermaid |

## Funcionalidades

### Renderização Direta

Os diagramas são lidos e renderizados diretamente em SVGs pela API oficial `mermaid.render()`. Os SVGs gerados são totalmente responsivos.

### Adaptação aos Modos Claro/Escuro

Os diagramas herdam a temática que você desejar. Quando o indicador `$q.dark.isActive` for alternado, O `DMermaidDiagram` rastreará tal mudança, re-inicializará um Mermaid com o novo contexto de tema e irá redesenhar toda a instância para espelhar a aparência visual geral do Docsector.

### Tratamento de Falhas

Se a sintaxe fornecida estiver incorreta, o componente elegantemente detecta a falha sem que a aplicação se quebre. Exibindo na tela, apenas para si, um bloco com erro e o código original abaixo com dicas do erro em desenvolvimento.

### Decodificação de Entidades HTML

Chaves numéricas de texto `&#123;` e `&#125;` tem seus devidos caracteres tratados antes do envio de renderização, garantindo harmonia entre os requisitos de visualização na extensão i18n padrão do Vue junto da estabilidade do código original desenhado para Mermaid em tempo-real.