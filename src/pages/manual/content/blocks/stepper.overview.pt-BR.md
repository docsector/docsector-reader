## Visão geral

Os blocos Stepper renderizam o Stepper vertical nativo do Quasar dentro do Markdown, combinando cabeçalhos numerados, navegação embutida e conteúdo rico em cada etapa.

Eles funcionam bem em onboarding, instalação, rotinas de release e instruções de troubleshooting nas quais a leitura deve seguir uma sequência.

O bloco é escrito com os custom elements Markdown `<d-block-stepper>` e `<d-block-step>`.

## Exemplo em HTML

````html
<d-block-stepper>
  <d-block-step title="Instale as dependências">

Execute `npm install` na raiz do projeto.

  </d-block-step>

  <d-block-step title="Inicie o servidor de desenvolvimento">

Execute `npm run dev` e abra a URL local mostrada no terminal.

  </d-block-step>

  <d-block-step title="Valide o resultado">

> [!TIP]
> Mantenha cada etapa focada em um único resultado.

```bash
npm run test
```

  </d-block-step>

  <d-block-step
    title="Publique a release"
    icon="rocket_launch"
    active-icon="rocket_launch"
    done-icon="task_alt"
  >

Use atributos de ícone quando a numeração sozinha não for expressiva o bastante para a etapa.

  </d-block-step>
</d-block-stepper>
````

## Observações

- Todo `<d-block-step>` precisa definir `title`.
- O bloco usa o Stepper vertical nativo do Quasar, então a leitura pode avançar pelos cabeçalhos das etapas ou pelos botões de navegação embutidos.
- O corpo de cada etapa aceita Markdown comum, como parágrafos, listas, alertas, blocos de código, imagens, tabelas e matemática.
- Cada etapa pode sobrescrever o ícone do cabeçalho com `icon`, `active-icon`, `done-icon` e `error-icon`.
- As etapas intermediárias mostram Continuar e Voltar; na última etapa, a ação principal muda para Finalizar.
- A navegação também pode ser feita diretamente pelos cabeçalhos.
- Apenas o corpo da etapa ativa fica expandido por vez; as demais etapas continuam visíveis na pilha de cabeçalhos.
- Títulos dentro de uma etapa são achatados para parágrafos, mantendo a tabela de conteúdos da página estável.
- Nesta primeira versão, trate Stepper aninhado e outros custom blocks do Docsector dentro de uma etapa como conteúdo não suportado.