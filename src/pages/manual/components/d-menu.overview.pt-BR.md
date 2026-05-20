## Visão Geral

`DMenu` é o componente de **navegação lateral esquerda**. Ele renderiza o branding do projeto, links externos, funcionalidade de busca e a árvore de páginas de documentação.

## Funcionalidades

- **Busca** — Filtra páginas pesquisando conteúdo, títulos e tags
- **Seção de branding** — Logo, nome do projeto, seletor de versão
- **Links externos** — GitHub, discussões, chat, email, changelog, roadmap, sponsor
- **Seção explore** — Links externos customizados
- **Árvore de páginas** — Gerada automaticamente do registro de páginas com painéis de expansão

## Busca

O input de busca no topo do menu filtra páginas comparando o termo de busca com:

1. **Tags** — Definidas em `src/i18n/tags.hjson`
2. **Conteúdo da página** — O source Markdown de cada sub-página overview, showcase e vs

A busca tem debounce de 300ms e suporta o locale atual com fallback para en-US.

## Seção de Branding

Lê do `docsector.config.js`:

- `branding.logo` — Imagem do logo do projeto
- `branding.name` — Texto do nome do projeto
- `branding.version` — Versão atual
- `branding.versions` — Opções do dropdown de versão, incluindo badges opcionais de release

O seletor mantém a documentação atual em rotas sem prefixo e troca versões arquivadas para rotas prefixadas. Por exemplo, `/guide/getting-started/overview/` pode trocar para `/v0.x/guide/getting-started/overview/` quando existe uma página equivalente em `src/pages/.old/v0.x/`.

Todo objeto de versão mostra um badge depois do label da versão. Versões lançadas usam `released` por padrão; versões com `released: false` ou `status: 'draft'` usam `draft`; versões com `status: 'deprecated'` ou `deprecated: true` usam `deprecated` em vermelho. O badge pode ser customizado com `badge: { label, color, textColor }`.

## Links Externos

Cada link é renderizado condicionalmente — defina como `null` no config para ocultar:

- **GitHub** — Link do repositório
- **Discussions** — GitHub Discussions
- **Chat** — Discord/Slack/etc.
- **Email** — Abre link mailto
- **Changelog** — Página externa ou interna
- **Roadmap** — Roadmap do projeto
- **Sponsor** — Página de patrocínio
- **Explore** — Array de links externos customizados

## Árvore de Páginas

A árvore de páginas é construída a partir das rotas do roteador no momento de criação do componente. Rotas são filtradas pela versão e pelo book ativos, depois agrupadas pelo basepath da página. Grupos com configuração `menu.header` recebem um painel de expansão com header sticky.

## Agrupamento de Itens

Itens são agrupados quando:

1. O primeiro item de um grupo de basepath tem `meta.menu.header` definido
2. Todos os itens subsequentes compartilhando o mesmo basepath são coletados no mesmo grupo

Itens sem header são exibidos como entradas independentes.

## Auto-Scroll

No mount e após navegação, DMenu automaticamente faz scroll até o item de menu ativo, centralizando-o no viewport com uma animação suave de 300ms.
