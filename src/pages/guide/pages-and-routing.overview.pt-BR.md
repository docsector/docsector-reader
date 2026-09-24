---
desc: Defina páginas nos registros divididos, ou direto no Markdown com frontmatter no estilo Quasar.
keys: frontmatter metadados yaml registro index avulsa oculta
---

## Registro de Páginas

As páginas de documentação são definidas em registros separados, como `src/pages/guide.index.js` e `src/pages/manual.index.js`. Cada entrada mapeia um caminho URL para sua configuração, dados traduzíveis e metadata opcional.

No manual atual, é comum manter referências centrais de UI sob `/basic`, blocos de conteúdo voltados ao usuário final sob `/content/blocks`, conceitos estruturais sob `/content/structures` e aliases legados voltados à engine sob `/components`.

## Estrutura de uma Entrada

```javascript
'/minha-pagina': &#123;
  config: &#123;
    icon: 'description',
    status: 'new',
    version: 'v2.1.0',
    book: 'guide',
    menu: &#123;&#125;,
    subpages: &#123; showcase: false &#125;
  &#125;,
  data: &#123;
    'en-US': &#123; title: 'My Page' &#125;,
    'pt-BR': &#123; title: 'Minha Página' &#125;
  &#125;
&#125;
```

## Propriedades do Config

- **book** — Prefixo da rota: `'guide'`, `'manual'` ou `'API'` (compatível com `type` legado). Um id que nenhum `*.book.js` define coloca a página fora de todos os books — veja Páginas Avulsas abaixo
- **status** — Status da página: `'done'`, `'draft'`, `'empty'` ou `'new'`; `new` é exibido em verde
- **version** — Versão opcional em que a página foi introduzida, exibida abaixo da data de última atualização como `Novo em: ...` (por exemplo, `'v2.1.0'`)
- **icon** — Nome do ícone Material Design exibido no menu lateral
- **menu** — Objeto controlando exibição do menu (header, subheader, separators, hidden)
- **link** — `&#123; to: '/guide/getting-started/overview/' &#125;` transforma a entrada num atalho do menu que redireciona para essa página; um atalho para outro book mostra uma seta (→) no menu
- **subpages** — Ativar abas adicionais: `showcase`, `vs`

## Nós de Categoria

Defina `config: null` para criar um nó de agrupamento não-navegável. Útil para criar títulos de seção no menu lateral:

```javascript
'/content/blocks': &#123;
  config: null,
  data: &#123;
    'en-US': &#123; title: 'Blocks' &#125;,
    'pt-BR': &#123; title: 'Blocos' &#125;
  &#125;
&#125;
```

## Agrupamento no Menu

Páginas são agrupadas no menu lateral pelo seu **basepath** (segundo segmento da URL). A primeira página de um grupo pode definir um `menu.header`:

```javascript
menu: &#123;
  header: &#123;
    icon: 'notes',
    label: 'Conteúdo'
  &#125;
&#125;
```

## Subheaders e Separadores

```javascript
menu: &#123;
  subheader: '.minha-secao',   // caminho i18n para label do subheader
  separators: &#123;
    lineTop: true,             // linha ACIMA do item
    lineBottom: true           // linha ABAIXO do item
  &#125;
&#125;
```

O valor de um separador também pode nomear uma variante de espessura dos estilos do menu — `lineBottom: 'page'` ou `lineBottom: 'list'` renderizam uma linha mais grossa.

A forma legada `separator: true` (ou uma string de sufixo de classe como `' page'`) continua suportada e significa uma linha **abaixo** do item; quando `separators` está presente, ele vence.

## Páginas Ocultas

Defina `menu.hidden` para manter uma página roteada e publicada enquanto a navegação a pula:

```javascript
menu: &#123; hidden: true &#125;
```

Uma página oculta:

- não aparece na árvore de páginas do menu lateral, então a busca do menu nunca a encontra;
- é pulada pelos links anterior/próximo, e não mostra os seus;
- nunca vira a página de entrada da aba do seu book, nem o fallback do seletor de versão;
- continua com suas rotas, seu HTML pré-renderizado, sua entrada no sitemap, sua cópia `.md` para agentes e seu lugar no `llms.txt` e na lista de páginas do MCP.

Aponte para ela a partir de uma página, do rodapé ou de um link do topo do menu lateral.

## Convenção de Arquivos Markdown

Cada página requer arquivos Markdown seguindo este padrão de nomenclatura:

`src/pages/&#123;book&#125;/&#123;path&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`

Por exemplo, uma página em `/content/blocks/headings` com book `manual`:

- `src/pages/manual/content/blocks/headings.overview.en-US.md`
- `src/pages/manual/content/blocks/headings.overview.pt-BR.md`
- `src/pages/manual/content/blocks/headings.showcase.en-US.md` (se showcase habilitado)

Uma página com chave `''` — a página raiz do seu book, ou uma página avulsa — dispensa o caminho: `src/pages/&#123;book&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`, ao lado da pasta do book.

## Frontmatter no Markdown

O arquivo Markdown de uma página pode abrir com um bloco de frontmatter — o mesmo estilo da documentação do Quasar, então páginas migradas de um projeto de docs Quasar mantêm seus metadados:

```markdown
---
title: Ajax Bar
desc: The QAjaxBar component displays a loading bar when a request is in progress.
keys: QAjaxBar loading progress
related:
  - /quasar-plugins/loading
---

## Overview
```

O bloco é metadado, nunca conteúdo: ele é removido da página renderizada, do sumário (ToC) e do índice de busca. O `.md` raw servido para agentes (e o `llms-full.txt`) o mantém intacto — exceto o `faq`, que sai do bloco e vira uma seção `## FAQ` legível no final.

Os metadados in-page mergeiam na entrada do registro da página. Uma chave presente nos dois lugares é **sobrescrita pela página**; uma chave presente só na página é **mergeada**. Chaves localizadas valem por arquivo — frontmatter em `headings.overview.pt-BR.md` só afeta os valores `pt-BR`.

| Chave | Efeito |
| ----- | ------ |
| `title` | Sobrescreve o título da página naquele locale (`data.<locale>.title`) |
| `desc` | Sobrescreve a descrição da página naquele locale (`config.meta.description.<locale>`) |
| `keys` | **Acrescenta** às tags de busca da sidebar naquele locale (`metadata.tags`) — as tags do registro são mantidas |
| `icon`, `status`, `version`, … | Chaves escalares de config do registro, sobrescritas apenas a partir do arquivo `overview`. Chaves de valor-objeto (`menu`, `subpages`, `link`, `layouts`) e blocos estruturais (`meta`, `data`, `metadata`) não podem ser definidos via frontmatter e geram warning no build |
| `examples`, `related`, qualquer outra | Guardada no config da página sem alteração, disponível para features futuras |
| `faq` | Renderiza o FAQ que fecha a página a partir de uma lista de itens `- q:` / `a:` — veja [FAQ da Página](/manual/basic/page-faq/overview/). Vale por arquivo e nunca entra no registro |
| `book` / `type` | Nunca honradas — o caminho do próprio arquivo decide o book |

Arquivos de subpágina (`showcase` / `vs`) só podem sobrescrever o `title` e o `desc` **da própria subpágina** (usados no `<title>`/descrição prerenderizados daquela rota), acrescentar `keys` e declarar o próprio `faq`; outras chaves ali geram warning no build e são ignoradas.

A sintaxe suportada é um subconjunto de YAML: escalares `key: value` (strings com aspas, booleanos, números, `null`; um valor pode continuar em linhas mais indentadas), block scalars (`|` literal, `>` dobrado, com os indicadores de chomping `-`/`+`), listas de um nível e listas de mapas (itens `- q: …` continuados por linhas indentadas até a primeira chave — a forma do `faq`). Um mapa direto sob uma chave, coleções inline e anchors não são suportados — linhas não suportadas geram warning no build e são puladas. O bloco só existe quando `---` é a primeira linha do arquivo e é fechado por uma linha `---` (ou `...`); um `---` mais adiante no documento continua sendo um separador temático comum.

## Geração de Rotas

Rotas são geradas automaticamente a partir do registro de páginas. Uma página com path `/my-page` e book `guide` produz:

- `/guide/my-page/overview` — Aba de conteúdo principal
- `/guide/my-page/showcase` — Aba de demonstração (se habilitada)
- `/guide/my-page/vs` — Aba de comparação (se habilitada)

Versões major arquivadas usam a mesma estrutura em `src/pages/.old/&#123;version&#125;/`. Uma página registrada em `src/pages/.old/v0.x/guide.index.js` produz `/v0.x/guide/my-page/overview`, enquanto a versão atual continua em `/guide/my-page/overview`.

## Páginas Avulsas

Uma página avulsa fica fora de todos os books: nenhuma aba de book fica destacada nela e nenhuma árvore de páginas a lista. Use-a para páginas sobre o projeto, e não sobre a documentação — patrocínio, anúncios, o time — e abra-a por um link do topo do menu lateral.

**1. Registre-a** como a última entrada de qualquer index cujo book não seja fullwidth (por exemplo `src/pages/guide.index.js`), com a chave `''`:

```javascript
'': &#123;
  config: &#123;
    book: 'sponsors',
    icon: 'favorite',
    status: 'done',
    menu: &#123; hidden: true &#125;
  &#125;,
  data: &#123;
    'en-US': &#123; title: 'Sponsors' &#125;,
    'pt-BR': &#123; title: 'Patrocinadores' &#125;
  &#125;
&#125;
```

`book` usa um id que nenhum `*.book.js` define: ele vira o prefixo da rota e não ganha aba. `menu.hidden` mantém a página fora do anterior/próximo, que percorre todos os books, e fora da árvore de páginas mostrada na própria página.

**2. Escreva o Markdown** na raiz de `src/pages/`:

- `src/pages/sponsors.overview.en-US.md`
- `src/pages/sponsors.overview.pt-BR.md`

O frontmatter (`title`, `desc`, `keys`, `faq`) funciona como em qualquer página.

**3. Aponte para ela.** A página responde em `/sponsors/overview/`, e `/sponsors` redireciona para lá. Aponte um link do topo do menu — e o fallback dos patrocinadores, numa página de patrocínio — para o caminho sem subpágina:

```javascript
links: &#123; sponsor: '/sponsors/' &#125;,
sponsors: &#123; enabled: true, fallbackUrl: '/sponsors/' &#125;
```

O link Sponsor passa a abrir a página na mesma aba e fica destacado enquanto ela está aberta — veja o [Menu de Navegação](/manual/basic/d-menu/overview/).

O que o leitor vê numa página avulsa:

| Área | Comportamento |
| --- | --- |
| Abas dos books | Nenhuma fica destacada; cada aba continua abrindo o seu book |
| Menu lateral | O mesmo menu da página inicial: busca, seletor de versão, links do topo e a árvore do book padrão, sem item destacado |
| Anterior / próximo | Nenhum |
| Conteúdo | Sumário, FAQ, feedback, patrocinadores e anúncio, como em qualquer página |
| Build | HTML pré-renderizado, entrada no sitemap, `.md` para agentes, uma seção própria no `llms.txt` e uma linha na lista de páginas do MCP; fora do índice de busca do menu |

Regras:

- Declare páginas avulsas na raiz de páginas atual, nunca em `src/pages/.old/&#123;version&#125;/` — o build avisa ali, porque um link do topo é um caminho fixo.
- O id não pode ser o id de um book registrado, uma pasta em `public/` ou um caminho de rota reservado: `assets`, `assistant`, `home`, `mcp` e — para a página com chave `''` — `404`, `feedback`, `index` (o build avisa nesses).
- Uma chave `''` por index. Mais páginas sob o mesmo id usam chaves nomeadas com o mesmo `book` e `menu.hidden`: `'/team'` responde em `/sponsors/team/overview/` a partir de `src/pages/sponsors/team.overview.&#123;lang&#125;.md`.
- A página herda os `layouts` do book cujo index a declara; defina `layouts` na entrada para mudá-los.
- `book` e `menu` não podem vir do frontmatter.
