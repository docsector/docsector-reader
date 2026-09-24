---
faq:
  - q: Por que uma página sempre mostra o mesmo anúncio?
    a: |
      O criativo é escolhido pelo caminho da página, então nunca muda ao recarregar
      e nunca pisca quando o app carrega; builds SSR também o incluem no HTML
      pré-renderizado. Páginas diferentes se espalham pelos seus criativos. O anúncio
      fica fora do Markdown servido aos agentes.
  - q: O anúncio carrega scripts de terceiros ou rastreia leitores?
    a: Não. Ele só mostra os criativos que você lista na config, sem scripts, cookies ou rastreamento.
---

## Visão Geral

O Anúncio da Página mostra um dos **seus próprios criativos** acima do conteúdo de cada página: um cartão pequeno com imagem, título, texto curto e link. Use-o para divulgar um curso, um livro, um parceiro de hospedagem ou o seu programa de patrocínio.

Ele aparece em toda página overview, showcase e vs, e nunca na homepage. O recurso é **opt-in**.

## Habilitando

Adicione um bloco `ads` ao `docsector.config.js`:

```js
ads: {
  enabled: true,
  items: [
    {
      href: 'https://example.com/course',
      image: '/images/promo/course.png',
      title: 'Official course',
      text: 'Learn it in a weekend, with hands-on projects.'
    }
  ]
}
```

## Vários Criativos

Liste mais itens e cada página mostra um deles:

```js
ads: {
  enabled: true,
  items: [
    { href: 'https://example.com/course', title: 'Official course' },
    { href: 'https://example.com/book', title: 'The book', image: '/images/promo/book.png' }
  ]
}
```

O criativo é escolhido pelo caminho da página. A mesma página sempre mostra o mesmo criativo (builds SSR já o trazem no HTML pré-renderizado), e páginas diferentes se espalham pela lista. Adicionar ou remover um criativo muda qual página mostra qual.

## Textos Localizados

`title` e `text` aceitam uma string simples ou um valor por locale:

```js
ads: {
  enabled: true,
  items: [
    {
      href: 'https://example.com/course',
      title: { 'en-US': 'Official course', 'pt-BR': 'Curso oficial' },
      text: { 'en-US': 'Learn it in a weekend.', 'pt-BR': 'Aprenda em um fim de semana.' }
    }
  ]
}
```

## O Anúncio de Exemplo

Com `enabled: true` e nenhum criativo ainda, a página mostra um anúncio de exemplo, **"Seu anúncio aqui"**. Ele abre o mesmo link de fallback das vagas de exemplo dos [Patrocinadores](/manual/basic/sponsors/overview/): `sponsors.fallbackUrl`, ou `links.sponsor` quando ele não está definido. Uma URL de outro site abre em uma nova aba; um caminho do seu site abre na mesma aba. Sem link de fallback, nada aparece. Quando o fallback é uma página de patrocínio avulsa (veja Páginas Avulsas em [Páginas e Rotas](/guide/pages-and-routing/overview/)), o anúncio de exemplo nessa página aponta para a própria página.

## Diretrizes para Criativos

- **Imagem**: 4:3, 256×192 recomendado. Ela aparece em 128×96 (96×72 no celular) e é recortada para preencher a caixa.
- **Título**: uma linha.
- **Texto**: até duas linhas — cerca de 100 caracteres no desktop, mais ou menos a metade no celular. Texto mais longo é cortado com reticências.
- O cartão tem altura fixa, então a página nunca se mexe, seja qual for o criativo.
- Prefira caminhos de imagem neutros, como `/images/promo/…`: bloqueadores de anúncio escondem caminhos como `/ads/` ou `banner`.

## Links

Os criativos abrem em uma nova aba com `rel="sponsored noopener"`, como os buscadores pedem para links pagos. O anúncio de exemplo aponta para a sua própria página de patrocínio: uma URL de outro site abre em uma nova aba com `rel="noopener"`, e um caminho do seu site abre na mesma aba.

## Warnings do Build

O `docsector build` e o `docsector dev` conferem o bloco e mostram um warning por problema:

| Warning | O que acontece | Correção |
|---------|----------------|----------|
| `ads must be an object` / `ads.enabled must be the boolean true` | O anúncio fica desligado | Escreva `ads: { enabled: true, … }` |
| `ads.items[…] needs an absolute http(s) href` | O criativo é ignorado | Aponte-o para uma URL completa `https://` |
| `ads.items[…] needs a title` | O criativo é ignorado | Adicione um `title` (string ou mapa por locale) |
| `ads.items[…] has an invalid text` / `… invalid image` | Só aquele campo é descartado | Corrija ou remova o campo |
| `ads is enabled but has no valid creative and no sponsors fallback URL` | Nenhum anúncio aparece | Adicione um criativo, ou defina `sponsors.fallbackUrl` ou `links.sponsor` |

## Textos da Interface

Sobrescreva estas chaves nos seus arquivos de idioma:

```hjson
page: {
  ad: {
    label: 'Patrocinado'
    example: 'Anuncie aqui'
  }
}
```

## Referência

### Configuração

```js
ads: {
  enabled: false,
  items: []
}
```

| Chave | Padrão | Descrição |
|-------|--------|-----------|
| `enabled` | `false` | Só o booleano `true` habilita o anúncio. |
| `items` | `[]` | Os seus criativos. |

### Criativo

| Chave | Descrição |
|-------|-----------|
| `href` | URL absoluta `http(s)`. |
| `title` | Uma string ou um mapa por locale. Obrigatório. |
| `text` | Opcional; uma string ou um mapa por locale. |
| `image` | Caminho opcional da imagem em `public/`, ou uma URL completa. |

Um `href` ou `title` inválido ignora o criativo com um warning no build; um `text` ou `image` inválido descarta só aquele campo.

### Chaves de idioma

| Chave | English | Português |
|-------|---------|-----------|
| `page.ad.label` | Ad | Anúncio |
| `page.ad.example` | Your ad here | Seu anúncio aqui |
| `system.support` | Sponsor this project | Patrocine este projeto |
