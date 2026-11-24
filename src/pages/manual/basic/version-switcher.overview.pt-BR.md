## Visão Geral

Seletor de Versão permite que o leitor navegue entre a documentação atual e versões arquivadas ou alternativas.

Ele ajuda a manter docs de longa duração utilizáveis quando o projeto suporta mais de uma linha de release.

## Como Funciona

- O seletor lê a lista de versões configuradas.
- A documentação atual normalmente fica em rotas sem prefixo.
- Versões arquivadas podem usar um prefixo como `/v0.x`.
- Quando possível, o seletor tenta abrir a página equivalente na versão de destino.
- Se a mesma página não existir lá, ele faz fallback para a primeira rota compatível naquele book.

## Badges de Release

O seletor pode mostrar badges como:

- `released`
- `draft`
- `deprecated`

Também é possível configurar labels e cores customizadas por versão.

## Versões em Desenvolvimento

Um release mais novo que a última versão lançada e que a documentação atual já cita — como a `version` que lança uma página ou como um dos seus releases em `updated` — entra sozinho no seletor, acima das versões configuradas, com um badge azul **em desenvolvimento**. Só contam as páginas da documentação atual, nunca as de uma versão arquivada ou de preview, nem uma página `draft` ou `empty`. Escolhê-lo abre a documentação atual, que já descreve o que está por vir; a partir dela, você continua onde está. Uma entrada configurada do mesmo release — `v1.4.0-dev` para a v1.4.0 — toma o lugar dele. Ela sai do seletor quando uma entrada configurada passa a listá-la e, depois de lançada, simplesmente deixa de ser mais nova que o último release. Veja Chips de versão em Páginas e Rotas.

## Observações

- Uma entrada de versão também pode apontar para uma URL externa.
- Mantenha os labels curtos para o dropdown continuar fácil de escanear.