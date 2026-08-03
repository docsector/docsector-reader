---
desc: Defina páginas nos registros divididos, ou direto no Markdown com frontmatter no estilo Quasar.
keys: frontmatter metadados yaml registro index
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

- **book** — Prefixo da rota: `'guide'`, `'manual'` ou `'API'` (compatível com `type` legado)
- **status** — Status da página: `'done'`, `'draft'`, `'empty'` ou `'new'`; `new` é exibido em verde
- **version** — Versão opcional em que a página foi introduzida, exibida abaixo da data de última atualização como `Novo em: ...` (por exemplo, `'v2.1.0'`)
- **icon** — Nome do ícone Material Design exibido no menu lateral
- **menu** — Objeto controlando exibição do menu (header, subheader, separators)
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

## Convenção de Arquivos Markdown

Cada página requer arquivos Markdown seguindo este padrão de nomenclatura:

`src/pages/&#123;book&#125;/&#123;path&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`

Por exemplo, uma página em `/content/blocks/headings` com book `manual`:

- `src/pages/manual/content/blocks/headings.overview.en-US.md`
- `src/pages/manual/content/blocks/headings.overview.pt-BR.md`
- `src/pages/manual/content/blocks/headings.showcase.en-US.md` (se showcase habilitado)

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

O bloco é metadado, nunca conteúdo: ele é removido da página renderizada, do sumário (ToC) e do índice de busca. O `.md` raw servido para agentes (e o `llms-full.txt`) o mantém intacto.

Os metadados in-page mergeiam na entrada do registro da página. Uma chave presente nos dois lugares é **sobrescrita pela página**; uma chave presente só na página é **mergeada**. Chaves localizadas valem por arquivo — frontmatter em `headings.overview.pt-BR.md` só afeta os valores `pt-BR`.

| Chave | Efeito |
| ----- | ------ |
| `title` | Sobrescreve o título da página naquele locale (`data.<locale>.title`) |
| `desc` | Sobrescreve a descrição da página naquele locale (`config.meta.description.<locale>`) |
| `keys` | **Acrescenta** às tags de busca da sidebar naquele locale (`metadata.tags`) — as tags do registro são mantidas |
| `icon`, `status`, `version`, … | Chaves escalares de config do registro, sobrescritas apenas a partir do arquivo `overview`. Chaves de valor-objeto (`menu`, `subpages`, `link`, `layouts`) e blocos estruturais (`meta`, `data`, `metadata`) não podem ser definidos via frontmatter e geram warning no build |
| `examples`, `related`, qualquer outra | Guardada no config da página sem alteração, disponível para features futuras |
| `book` / `type` | Nunca honradas — o caminho do próprio arquivo decide o book |

Arquivos de subpágina (`showcase` / `vs`) só podem sobrescrever o `title` e o `desc` **da própria subpágina** (usados no `<title>`/descrição prerenderizados daquela rota) e acrescentar `keys`; outras chaves ali geram warning no build e são ignoradas.

A sintaxe suportada é um subconjunto de YAML: escalares `key: value` (strings com aspas, booleanos, números, `null`) e listas de um nível. Mapas aninhados, block scalars, coleções inline e anchors não são suportados — linhas não suportadas geram warning no build e são puladas. O bloco só existe quando `---` é a primeira linha do arquivo e é fechado por uma linha `---` (ou `...`); um `---` mais adiante no documento continua sendo um separador temático comum.

## Geração de Rotas

Rotas são geradas automaticamente a partir do registro de páginas. Uma página com path `/my-page` e book `guide` produz:

- `/guide/my-page/overview` — Aba de conteúdo principal
- `/guide/my-page/showcase` — Aba de demonstração (se habilitada)
- `/guide/my-page/vs` — Aba de comparação (se habilitada)

Versões major arquivadas usam a mesma estrutura em `src/pages/.old/&#123;version&#125;/`. Uma página registrada em `src/pages/.old/v0.x/guide.index.js` produz `/v0.x/guide/my-page/overview`, enquanto a versão atual continua em `/guide/my-page/overview`.
