---
faq:
  - q: Por que os sublinks não aparecem no código-fonte da página?
    a: |
      Os menus suspensos só são renderizados quando abrem, então os links deles não fazem
      parte do HTML pré-renderizado. As páginas para as quais apontam continuam no sitemap,
      no `llms.txt` e no índice de busca — só o menu é montado no navegador.
  - q: Por que um link para `/guide/` abre em nova aba?
    a: |
      Um book não tem página própria na raiz: `/guide/` não corresponde a nenhuma página,
      então é tratado como um arquivo estático. Aponte para uma página de verdade, como
      `/guide/getting-started/`.
---

## Visão Geral

Os Links do Header adicionam a sua própria navegação ao header principal: alguns links **centralizados** na barra do topo, com **ícones** e **menus suspensos**. Use-os para os lugares que o leitor deve alcançar sempre com um clique — o seu site, uma página de patrocínio, um blog, as outras documentações.

Onde o header não tem espaço para eles — nos celulares, ou ao lado do menu lateral em desktops menores — os links vão para um menu que abre por uma seta **colada à marca**, para o header nunca ficar apertado.

O recurso é **opt-in**.

## Habilitando

Adicione um bloco `header` ao `docsector.config.js`:

```js
header: {
  links: [
    { label: 'Website', href: 'https://example.com' },
    { label: 'Getting started', href: '/guide/getting-started/' }
  ]
}
```

## Ícones

Dê a um link um `icon` com o nome de um [ícone Material](https://fonts.google.com/icons):

```js
{ label: 'Sponsors', icon: 'favorite', href: '/sponsors/' }
```

O build inclui só os ícones que a sua config usa.

## Menus Suspensos

Um link com `children` vira um menu suspenso. Os sublinks têm `label`, `icon` opcional e `href`:

```js
header: {
  links: [
    { label: 'Ecossistema', icon: 'hub', children: [
      { label: 'Benchmarks', icon: 'speed', href: 'https://example.com/benchmarks' },
      { label: 'Plugins', href: '/guide/plugins/' }
    ] }
  ]
}
```

Há um nível de sublinks. O `href` do próprio menu suspenso é ignorado — ele só abre o menu.

## Onde os Links Abrem

Um link abre como os [links do topo do menu lateral](/manual/basic/d-menu/overview/):

| `href` | Abre |
| --- | --- |
| Uma URL (`https://…`) | Em nova aba, com o ícone de link externo |
| O caminho de uma página deste site (`/sponsors/`) | No lugar |
| Qualquer outro caminho (`/feed.xml`, um arquivo em `public/`) | Em nova aba, com o ícone de link externo |

Aponte para uma página, não para a raiz de um book: `/guide/getting-started/`, não `/guide/`.

## Destaque

Um link para uma página do site fica destacado enquanto ela está aberta. Use o caminho sem subpágina (`/sponsors/` em vez de `/sponsors/overview/`) para ele continuar destacado também nas abas showcase e vs. Um menu suspenso fica destacado quando um dos sublinks está.

## Quando Não Há Espaço

Os links centralizados só aparecem onde cabem. A partir dos rótulos e ícones da sua config, o Docsector estima a largura dos links e os mostra quando o header tem esse espaço livre — o menu lateral e o painel do assistente contam contra ele, só a largura da tela não decide. Os links nunca quebram linha nem são cortados.

Onde não cabem, aparece uma seta logo depois da marca. Ela abre um menu com todos os links; um menu suspenso aparece como uma pequena seção com os seus sublinks. A marca continua levando à página inicial. Nos celulares a seta é sempre usada; ao lado do menu lateral, três links curtos aparecem a partir de telas de uns 1200px, uma lista maior só em telas mais largas.

Quando os links aparecem, ficam centralizados e o nome da marca é encurtado primeiro, até sobrar só o logo. Use rótulos curtos e um menu suspenso quando a lista crescer.

Nos menus, as setas do teclado passam de um link para outro, Home e End vão ao primeiro e ao último, e Esc fecha o menu.

## Warnings do Build

O `docsector build` e o `docsector dev` conferem o bloco e mostram um warning por problema:

| Warning | O que acontece | Correção |
| --- | --- | --- |
| `header must be an object` / `header.links must be an array` | Sem links no header | Escreva `header: { links: [ … ] }` |
| `… needs a label (a string or a locale map)` | O link é ignorado | Adicione um `label` |
| `… needs an href or children` | O link é ignorado | Adicione um `href` — escrito `href`, não `url` — ou `children` |
| `… has an invalid icon` | O link aparece sem ícone | Use o nome de um ícone Material |
| `… children must be an array` | O link é tratado como um link simples | Escreva `children: [ … ]` |
| `… has children — its href is ignored` | O menu suspenso só abre o menu | Remova o `href` ou mova-o para um sublink |
| `… has children — only one level of sublinks is shown` | Os links mais profundos são descartados | Coloque-os direto no menu suspenso |
| `… has no valid sublinks` | O menu suspenso é ignorado | Corrija os sublinks |

## Textos

A navegação e a seta levam o nome da chave `header.links`, e os leitores de tela anunciam `header.newTab` depois de um link que abre em nova aba. Sobrescreva-as nos seus arquivos de idioma:

```hjson
header: {
  links: 'Links do projeto'
  newTab: 'nova aba'
}
```

## Referência

### Configuração

```js
header: {
  links: []
}
```

| Chave | Padrão | Descrição |
| --- | --- | --- |
| `links` | `[]` | Os links do header, na ordem em que aparecem. |

### Link

| Chave | Descrição |
| --- | --- |
| `label` | Uma string ou um mapa por locale (`&#123; 'en-US': 'Blog', 'pt-BR': 'Blog' &#125;`). Obrigatório. |
| `icon` | Nome opcional de um ícone Material. |
| `href` | Uma URL, ou o caminho de uma página deste site. Obrigatório, a menos que o link tenha `children`. |
| `children` | Sublinks opcionais, cada um com `label`, `icon` e `href`. |

### Chaves de idioma

| Chave | English | Português |
| --- | --- | --- |
| `header.links` | Site links | Links do site |
| `header.newTab` | opens in a new tab | abre em nova aba |
