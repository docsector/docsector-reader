## Pipeline de Internacionalização

O Docsector Reader usa **vue-i18n** com arquivos de locale **HJSON** e conteúdo **Markdown** embutido. O sistema i18n carrega e mescla traduções com o conteúdo das páginas automaticamente no build.

## Arquivos de Idioma

Os arquivos de idioma ficam em `src/i18n/languages/` como arquivos HJSON:

- `en-US.hjson` — Traduções em inglês
- `pt-BR.hjson` — Traduções em português

Esses arquivos contêm strings de UI para o menu, configurações, navegação de página e outros labels do sistema.

## Estrutura HJSON

```javascript
&#123;
  _: &#123;
    home: &#123;
      texts: ['Documentação oficial do ']
    &#125;
    guide: &#123;&#125;
    manual: &#123;&#125;
    API: &#123;&#125;
  &#125;
  menu: &#123;
    search: 'Pesquisar'
    home: 'Página inicial'
  &#125;
  page: &#123;
    edit: &#123;
      github: &#123; edit: 'Edite esta página' &#125;
    &#125;
  &#125;
&#125;
```

O objeto `_` é o namespace raiz para páginas. Títulos e conteúdo das páginas são **injetados automaticamente** pelo loader i18n a partir do registro de páginas e dos arquivos Markdown.

## Conteúdo Markdown

O conteúdo da documentação é escrito em Markdown padrão com algumas convenções:

### Títulos

Use `##` até `######` para títulos de seção. Cada título se torna uma âncora de navegação na árvore de ToC.

### Blocos de Código

Blocos de código cercados suportam syntax highlighting via Prism.js:

- `php` — Código PHP
- `bash` — Comandos Shell
- `html` — Markup HTML
- `javascript` — Código JavaScript

### Atributos Customizados

O plugin `markdown-it-attrs` permite atributos customizados usando sintaxe `:attr;`:

```
:filename="exemplo.php";
```

Isso é usado pelo `DPageSourceCode` para exibir nomes de arquivo acima dos blocos de código.

## Adicionando um Novo Idioma

1. Crie `src/i18n/languages/xx-XX.hjson` com todas as traduções de UI
2. Adicione o idioma ao array languages em `docsector.config.js`
3. Adicione o locale ao array langs em `src/i18n/index.js`
4. Crie arquivos `.md` para cada página com o sufixo do novo locale
5. Adicione uma imagem de bandeira em `public/images/flags/`

## Plugin Vite para HJSON

O Docsector inclui um plugin Vite customizado que transforma imports HJSON em JSON no build. Isso é configurado automaticamente em `quasar.config.js` — nenhuma configuração adicional necessária.
