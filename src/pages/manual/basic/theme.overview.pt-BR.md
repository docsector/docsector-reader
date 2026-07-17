## Visão Geral

Todo site Docsector oferece três modos de tema no diálogo de Configurações: **Automático**, **Claro** e **Escuro**.

**Automático é o padrão.** Um leitor com o sistema operacional no modo escuro abre a documentação no escuro — sem precisar clicar em nada — e um leitor num sistema claro recebe o tema claro. Claro e Escuro são overrides explícitos, para quem quer um tema independente do sistema.

Funciona de fábrica. **Não existe chave de configuração** — Automático é sempre o padrão do engine.

## O Que os Leitores Percebem

- O site combina com as cores do sistema já na primeira visita
- Trocar o tema do SO troca o site **ao vivo**, sem recarregar
- Escolher Claro ou Escuro nas Configurações sobrepõe o sistema definitivamente
- Nenhum flash do tema errado durante o carregamento

## Como o Tema é Resolvido

A escolha é guardada no `localStorage` sob `setting.theme`, com um de três valores:

```text :toolbar="true";
auto | light | dark
```

`auto` resolve pela media query `prefers-color-scheme`, e o site continua ouvindo essa media query — então quem troca o tema do SO vê a documentação acompanhar na hora. `light` e `dark` fixam o tema e ignoram o sistema.

## Por Que Não Há Flash

Um script minúsculo roda no topo da página — antes do bundle da aplicação carregar — lê a preferência guardada (ou o esquema de cores do sistema) e aplica o tema. Quando o navegador pinta pela primeira vez, o tema correto já está no lugar.

A aplicação então aplica a mesma preferência antes que o Dark plugin do Quasar possa cair no valor do sistema, de modo que o tema nunca muda entre a primeira pintura e a página montada.

## Migrando de uma Versão Anterior

Antes da v4.16.0 o tema era um booleano guardado em `setting.background`. Os leitores mantêm a escolha:

- **Escuro** guardado — mantido como `dark`. Só poderia ter vindo de um clique explícito.
- **Claro** guardado — vira `auto`. Versões antigas gravavam esse valor automaticamente na primeira visita de todo leitor, então ele não pode ser distinguido de "nunca escolheu um tema". Quem deliberadamente escolheu Claro num sistema escuro verá o site seguir o sistema uma vez; escolher Claro de novo grava a escolha explicitamente e ela permanece para sempre.

A chave antiga não é tocada, e o valor novo é escrito na primeira vez que o leitor carrega a v4.16.0 ou posterior.

## Mudando os Textos

Os rótulos das Configurações vêm das chaves i18n `settings.appearance.theme`. Sobrescreva nos seus próprios arquivos de idioma:

```text
settings: {
  appearance: {
    theme: {
      _: 'Esquema de Cores',
      auto: 'Sistema',
      light: 'Dia',
      dark: 'Noite'
    }
  }
}
```

## Notas

- Componentes que reagem ao tema leem as classes `body--light` / `body--dark` do Quasar no body — veja o [guia de Temas](/theming) para o lado CSS.
- Blocos de terminal mantêm o canvas escuro nos dois temas, como um terminal de verdade.
- Imagens em Markdown escritas com `<picture>` e `media="(prefers-color-scheme: dark)"` seguem o **sistema operacional**, não o tema do site. No modo Automático os dois sempre concordam; eles podem divergir para quem fixa o tema oposto.
