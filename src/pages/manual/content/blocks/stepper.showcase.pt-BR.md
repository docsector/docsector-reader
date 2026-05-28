## Showcase

Os exemplos abaixo usam o renderer nativo do Stepper vertical do Quasar. Clique no cabeçalho de uma etapa ou use os botões de navegação dentro da etapa ativa.

### Fluxo básico de setup

<d-block-stepper>
  <d-block-step title="Instale as dependências">

Execute `npm install` na raiz do projeto.

  </d-block-step>

  <d-block-step title="Inicie o servidor de desenvolvimento">

Execute `npm run dev` e mantenha o terminal aberto durante o trabalho.

  </d-block-step>

  <d-block-step title="Abra a aplicação">

Visite a URL local impressa pela CLI e confirme que a homepage foi carregada.

  </d-block-step>
</d-block-stepper>

### Markdown rico

<d-block-stepper>
  <d-block-step title="Confira os pré-requisitos">

- Node.js 20 ou superior
- npm 9 ou superior
- Acesso ao repositório do projeto

  </d-block-step>

  <d-block-step title="Execute os smoke checks">

> [!TIP]
> Corrija falhas de lint ou teste antes de abrir um pull request.

```bash
npm run lint
npm run test
```

  </d-block-step>

  <d-block-step title="Registre o resultado">

Anexe a saída dos comandos, documente warnings relevantes e adicione o link da issue ou do pull request relacionado.

  </d-block-step>
</d-block-stepper>

### Sequência de troubleshooting

<d-block-stepper>
  <d-block-step title="Reproduza o problema">

Descreva exatamente a página, o navegador e a ação que dispararam o erro.

  </d-block-step>

  <d-block-step title="Colete evidências">

Tire uma captura de tela, copie a saída do console e anote se o problema também acontece no mobile.

  </d-block-step>

  <d-block-step title="Valide a correção">

Repita o mesmo fluxo depois da mudança e confirme que a falha original deixou de aparecer.

  </d-block-step>
</d-block-stepper>

### Ícones personalizados no cabeçalho

<d-block-stepper>
  <d-block-step title="Conecte o repositório" icon="folder_open" active-icon="folder_open" done-icon="task_alt">

Clone o repositório ou abra o workspace local existente antes de começar o fluxo.

  </d-block-step>

  <d-block-step title="Revise a issue" icon="manage_search" active-icon="manage_search" done-icon="task_alt">

Leia a reprodução, confirme o escopo e identifique a menor correção possível.

  </d-block-step>

  <d-block-step title="Entregue o patch" icon="rocket_launch" active-icon="rocket_launch" done-icon="verified">

Execute os checks focados, atualize a documentação e prepare a mudança para revisão.

  </d-block-step>
</d-block-stepper>

### Ícones diferentes por estado

<d-block-stepper>
  <d-block-step title="Esboce o plano" active-icon="edit_note" done-icon="task_alt">

Mantenha a numeração enquanto a etapa está inativa e troque para um ícone mais claro quando ela estiver ativa ou concluída.

  </d-block-step>

  <d-block-step title="Valide a saída" active-icon="play_circle" done-icon="check_circle">

Esse padrão é útil quando você quer cabeçalhos numerados por padrão, mas ainda deseja feedback visual durante a execução.

  </d-block-step>
</d-block-stepper>