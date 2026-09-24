---
faq:
  - q: Por que meus patrocinadores não aparecem com o assistente aberto?
    a: |
      Os patrocinadores ficam na coluna do sumário e seguem essa coluna. Em
      desktops estreitos demais para o conteúdo, o sumário e o assistente juntos,
      o assistente ocupa o lugar da coluna, e os patrocinadores vão junto.
  - q: Um patrocinador pode ter um link normal (dofollow)?
    a: Não. Links de patrocinadores são espaços pagos e sempre levam `rel="sponsored noopener"`, como os buscadores pedem para links pagos.
  - q: Como adiciono um terceiro tier?
    a: Adicione outra entrada `{ id, layout }` em `tiers`. Os tiers aparecem na ordem em que você os lista, e cada um escolhe o layout `wide` ou `square`.
---

## Visão Geral

Os Patrocinadores mostram os logos dos patrocinadores do seu projeto abaixo do sumário, na mesma coluna. Os tiers vão do mais alto para baixo: o tier do topo mostra um logo **largo** por linha, e o tier seguinte mostra logos **quadrados**, dois por linha.

Todo tier que ainda não tem patrocinador mostra uma vaga de exemplo **"Seu patrocinador aqui"**, e o painel sempre termina com um botão tracejado **"Sua logo aqui"**. Os dois abrem a sua página de patrocínio, para novos patrocinadores te encontrarem com facilidade.

O recurso é **opt-in**.

## Habilitando

Adicione um bloco `sponsors` ao `docsector.config.js`:

```js
links: {
  sponsor: 'https://github.com/sponsors/your-org'
},

sponsors: {
  enabled: true,
  tiers: [
    { id: 'platinum', layout: 'wide' },
    { id: 'gold', layout: 'square' }
  ],
  items: [
    { name: 'Acme', tier: 'platinum', href: 'https://acme.example', logo: '/images/sponsors/acme.svg' },
    { name: 'Globex', tier: 'gold', href: 'https://globex.example', logo: '/images/sponsors/globex.png' }
  ]
}
```

Coloque os arquivos de logo em `public/images/sponsors/`.

## Tiers e Layouts

Liste os tiers do mais alto para o mais baixo. Cada patrocinador indica o seu tier pelo `id`.

| Layout | Por linha | Caixa | Logo recomendado |
|--------|-----------|-------|------------------|
| `wide` | 1 | 3:1 | 600×200 |
| `square` | 2 | 1:1 | 300×300 |

Use um SVG, ou um PNG transparente com um respiro dentro da imagem. O logo é encaixado na caixa sem cortes, e o tamanho da caixa nunca depende da imagem, então a página não se mexe enquanto os logos carregam.

## Logos para o Tema Escuro

Adicione `logoDark` quando um logo precisar de outra versão no tema escuro:

```js
{ name: 'Acme', tier: 'platinum', href: 'https://acme.example', logo: '/images/sponsors/acme.svg', logoDark: '/images/sponsors/acme-dark.svg' }
```

A troca acontece no CSS, então o navegador só baixa a versão que mostra. Sem `logoDark`, o logo fica sobre uma placa clara no tema escuro, para arte escura continuar legível.

## Vagas de Exemplo e o Botão "Sua Logo Aqui"

As vagas de exemplo e o botão abrem o **link de fallback**:

- `sponsors.fallbackUrl`, quando você o define;
- senão, `links.sponsor`, o mesmo link do botão de patrocínio do menu.

```js
sponsors: {
  enabled: true,
  fallbackUrl: '/sponsors/',
  tiers: [{ id: 'platinum', layout: 'wide' }, { id: 'gold', layout: 'square' }],
  items: []
}
```

Sem nenhum patrocinador, o painel mostra uma vaga de exemplo por tier e o botão. Um link para outro site abre em uma nova aba; um caminho do seu site abre na mesma aba. Sem link de fallback, os tiers vazios e o botão ficam ocultos.

Um bom destino é uma página de patrocínio sua que fica fora de todos os books, aberta também pelo link Sponsor do menu — veja Páginas Avulsas em [Páginas e Rotas](/guide/pages-and-routing/overview/). Nessa página, as vagas de exemplo e o botão apontam para a própria página.

## Onde Aparece e Quando Some

Os patrocinadores seguem o sumário:

| Onde | Comportamento |
|------|---------------|
| Desktop | Abaixo da árvore, na coluna da direita |
| Tablet (768–1023px) | Na gaveta do sumário, sobre o conteúdo |
| Celular (abaixo de 768px) | Abaixo da árvore, no diálogo do sumário |
| Homepage | Quando o layout dela mostra o sumário |

Eles somem sempre que o sumário some: o botão de alternar o sumário, páginas ou books com `toc: false`, o layout `fullwidth` e desktops em que o assistente ocupa a coluna.

## Links

Os logos dos patrocinadores abrem em uma nova aba com `rel="sponsored noopener"`. As vagas de exemplo e o botão apontam para a sua própria página de patrocínio: uma URL de outro site abre em uma nova aba com `rel="noopener"`, e um caminho do seu site abre na mesma aba.

## Warnings do Build

O `docsector build` e o `docsector dev` conferem o bloco e mostram um warning por problema; o resto continua funcionando. A tabela diz o que acontece:

| Warning | O que acontece | Correção |
|---------|----------------|----------|
| `sponsors must be an object` | O painel fica desligado | Escreva `sponsors: { … }` |
| `sponsors.enabled must be the boolean true` | O painel fica desligado | Escreva `enabled: true`, não `'true'` ou `1` |
| `sponsors.tiers must list at least one { id, layout } tier` | Só o botão aparece | Declare os seus tiers |
| `… needs a non-empty string id` / `… repeats the id …` | O tier é ignorado | Dê a cada tier um id único |
| `… has an unknown layout …` | O tier usa `square` | Use `wide` ou `square` |
| `… names an undeclared tier …` | O patrocinador é ignorado | Use um dos ids de tier declarados |
| `… needs an absolute http(s) href` | O patrocinador é ignorado | Aponte o patrocinador para uma URL completa `https://` |
| `… needs a name` / `… needs a logo` | O patrocinador é ignorado | Preencha o campo que falta |
| `… has an invalid logoDark` | O logo claro vale para os dois temas | Use um caminho ou uma URL de logo |
| `sponsors.fallbackUrl must be an http(s) URL or a root-relative path` | Vale o `links.sponsor` no lugar | Use `https://…` ou `/caminho` |
| `links.sponsor must be … — not used as the sponsors fallback` | Sem link de fallback (o link do menu não muda) | Use `https://…` ou `/caminho` |
| `sponsors is enabled but has nothing to show` | O painel fica oculto | Adicione um patrocinador, ou defina `sponsors.fallbackUrl` ou `links.sponsor` |

## Textos

Sobrescreva estas chaves nos seus arquivos de idioma para mudar os textos:

```hjson
page: {
  sponsors: {
    title: 'Nossos patrocinadores'
    cta: 'Seja um patrocinador'
  }
}
```

## Referência

### Configuração

```js
sponsors: {
  enabled: false,
  fallbackUrl: null,
  tiers: [],
  items: []
}
```

| Chave | Padrão | Descrição |
|-------|--------|-----------|
| `enabled` | `false` | Só o booleano `true` habilita o painel. |
| `fallbackUrl` | `null` | Link das vagas de exemplo, do botão e do [anúncio de exemplo](/manual/basic/page-ad/overview/). Na falta dele, vale o `links.sponsor`. |
| `tiers` | `[]` | Os tiers, do mais alto para o mais baixo. Obrigatório quando habilitado. |
| `items` | `[]` | Os patrocinadores. |

### Tier

| Chave | Descrição |
|-------|-----------|
| `id` | Nome único que os patrocinadores referenciam. |
| `layout` | `wide` ou `square`. Um layout desconhecido vira `square`. |

### Patrocinador

| Chave | Descrição |
|-------|-----------|
| `name` | Nome do patrocinador, usado como texto alternativo do logo. |
| `tier` | O `id` do tier dele. |
| `href` | URL absoluta `http(s)`. |
| `logo` | Caminho do logo em `public/`, ou uma URL completa. |
| `logoDark` | Logo opcional para o tema escuro. |

### Chaves de idioma

| Chave | English | Português |
|-------|---------|-----------|
| `page.sponsors.title` | Sponsors | Patrocinadores |
| `page.sponsors.cta` | Your logo here | Sua logo aqui |
| `page.sponsors.example` | Your sponsor here | Seu patrocinador aqui |
| `system.support` | Sponsor this project | Patrocine este projeto |
