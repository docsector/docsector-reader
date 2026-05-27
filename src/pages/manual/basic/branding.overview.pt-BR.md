## Visão Geral

Branding controla a identidade visual e os links de acesso rápido exibidos no topo do menu da documentação.

Ele cobre o logo do projeto, o nome, o label da versão atual e os links externos que aparecem abaixo do bloco de branding.

## Configuração Principal

Os dados de branding vêm de `docsector.config.js`:

- `branding.logo`
- `branding.name`
- `branding.version`
- `links.github`, `links.discussions`, `links.chat`, `links.email`
- `links.changelog`, `links.roadmap`, `links.sponsor`, `links.explore`

## O Que o Leitor Percebe

- Uma identidade reconhecível do projeto no menu
- Acesso mais rápido ao repositório e aos links da comunidade
- Um lugar estável para entender qual conjunto de docs está sendo lido

## Observações

- Defina um link como `null` para escondê-lo do menu.
- Um logo quadrado ou quase quadrado costuma funcionar melhor na barra lateral.
- Mantenha o nome visível do projeto curto o suficiente para leitura rápida.