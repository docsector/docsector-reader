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

## Geração de Rotas

Rotas são geradas automaticamente a partir do registro de páginas. Uma página com path `/my-page` e book `guide` produz:

- `/guide/my-page/overview` — Aba de conteúdo principal
- `/guide/my-page/showcase` — Aba de demonstração (se habilitada)
- `/guide/my-page/vs` — Aba de comparação (se habilitada)

Versões major arquivadas usam a mesma estrutura em `src/pages/.old/&#123;version&#125;/`. Uma página registrada em `src/pages/.old/v0.x/guide.index.js` produz `/v0.x/guide/my-page/overview`, enquanto a versão atual continua em `/guide/my-page/overview`.
