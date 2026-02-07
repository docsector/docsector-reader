## Registro de Páginas

Todas as páginas de documentação são definidas em `src/pages/index.js`. Cada entrada mapeia um caminho URL para sua configuração, dados traduzíveis e metadata opcional.

## Estrutura de uma Entrada

```javascript
'/minha-pagina': &#123;
  config: &#123;
    icon: 'description',
    status: 'done',
    type: 'guide',
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

- **type** — Prefixo da rota: `'guide'`, `'manual'` ou `'API'`
- **status** — Status da página: `'done'`, `'draft'` ou `'empty'`
- **icon** — Nome do ícone Material Design exibido no menu lateral
- **menu** — Objeto controlando exibição do menu (header, subheader, separator)
- **subpages** — Ativar abas adicionais: `showcase`, `vs`

## Nós de Categoria

Defina `config: null` para criar um nó de agrupamento não-navegável. Útil para criar títulos de seção no menu lateral:

```javascript
'/components': &#123;
  config: null,
  data: &#123;
    'en-US': &#123; title: 'Components' &#125;,
    'pt-BR': &#123; title: 'Componentes' &#125;
  &#125;
&#125;
```

## Agrupamento no Menu

Páginas são agrupadas no menu lateral pelo seu **basepath** (segundo segmento da URL). A primeira página de um grupo pode definir um `menu.header`:

```javascript
menu: &#123;
  header: &#123;
    icon: 'widgets',
    label: 'Components'
  &#125;
&#125;
```

## Subheaders e Separadores

```javascript
menu: &#123;
  subheader: '.minha-secao',   // caminho i18n para label do subheader
  separator: ' page'           // sufixo de classe CSS para separador
&#125;
```

## Convenção de Arquivos Markdown

Cada página requer arquivos Markdown seguindo este padrão de nomenclatura:

`src/pages/&#123;type&#125;/&#123;path&#125;.&#123;subpage&#125;.&#123;lang&#125;.md`

Por exemplo, uma página em `/components/d-page` com type `manual`:

- `src/pages/manual/components/d-page.overview.en-US.md`
- `src/pages/manual/components/d-page.overview.pt-BR.md`
- `src/pages/manual/components/d-page.showcase.en-US.md` (se showcase habilitado)

## Geração de Rotas

Rotas são geradas automaticamente a partir do registro de páginas. Uma página com path `/my-page` e type `guide` produz:

- `/guide/my-page/overview` — Aba de conteúdo principal
- `/guide/my-page/showcase` — Aba de demonstração (se habilitada)
- `/guide/my-page/vs` — Aba de comparação (se habilitada)
