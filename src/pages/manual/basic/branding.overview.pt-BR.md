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

## A Assinatura da Marca

O header e o menu não mostram o `branding.name` sozinho — eles o renderizam como uma assinatura junto da palavra *Documentação*, para que o leitor sempre saiba em qual conjunto de docs está.

O texto vive na chave de i18n `system.brand`, onde `{name}` é substituído pelo `branding.name`. Cada idioma é dono da frase inteira, inclusive da ordem das palavras:

```text
en-US:  '{name} Documentation'   →  Bootgly Documentation
pt-BR:  'Documentação {name}'    →  Documentação Bootgly
```

Para mudar, sobrescreva `system.brand` nos seus próprios arquivos de idioma:

```text
system: {
  brand: 'Documentação Oficial {name}'
}
```

## O Que o Leitor Percebe

- Uma identidade reconhecível do projeto no menu
- Acesso mais rápido ao repositório e aos links da comunidade
- Um lugar estável para entender qual conjunto de docs está sendo lido

## Observações

- Defina um link como `null` para escondê-lo do menu.
- Um logo quadrado ou quase quadrado costuma funcionar melhor na barra lateral.
- Mantenha o nome visível do projeto curto o suficiente para leitura rápida.