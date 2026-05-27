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

Veja também as páginas dedicadas do manual para cada bloco:

- [Parágrafos](/manual/content/blocks/paragraphs/overview/), [Títulos](/manual/content/blocks/headings/overview/), [Listas não ordenadas](/manual/content/blocks/unordered-lists/overview/), [Listas ordenadas](/manual/content/blocks/ordered-lists/overview/)
- [Hints](/manual/content/blocks/hints/overview/), [Citação](/manual/content/blocks/quotes/overview/), [Blocos de código](/manual/content/blocks/code-blocks/overview/), [Diagramas Mermaid](/manual/content/blocks/mermaid-diagrams/overview/)
- [Imagens](/manual/content/blocks/images/overview/), [Math & TeX](/manual/content/blocks/math-and-tex/overview/), [Expansível](/manual/content/blocks/expandable/overview/), [Tabelas](/manual/content/blocks/tables/overview/), [HTML bruto](/manual/content/blocks/raw-html/overview/) e [Quick Links](/manual/content/blocks/quick-links/overview/)

### Títulos

Use `##` até `######` para títulos de seção. Cada título se torna uma âncora de navegação na árvore de ToC.

### Blocos de Código

Blocos de código cercados suportam syntax highlighting via Prism.js:

- `php` — Código PHP
- `bash` — Comandos Shell
- `html` — Markup HTML
- `javascript` — Código JavaScript

### Diagramas Mermaid

Você pode renderizar diagramas Mermaid usando blocos de código com o indicador de linguagem `mermaid`. Os diagramas se adaptam automaticamente aos modos claro e escuro.

```
&#96;&#96;&#96;mermaid
flowchart TD
  A[Início] --> B[Fim]
&#96;&#96;&#96;
```

### Math e TeX

O Docsector suporta fórmulas com KaTeX nos fluxos normais de Markdown, incluindo parágrafos, alertas e conteúdo expansível.

Use delimitadores com um dólar para fórmulas inline, como $E = mc^2$.

Use delimitadores com dois dólares para fórmulas em bloco:

```markdown
$$
\int_0^1 x^2 dx
$$
```

Os delimitadores matemáticos permanecem literais dentro de código inline e fenced code, então exemplos de sintaxe podem ser documentados sem renderizar a equação.

### Alertas do GitHub

O Docsector tambem suporta blockquotes de alerta no estilo do GitHub:

```markdown
> [!IMPORTANT]
> O repositorio original foi arquivado.
>
> Continue o desenvolvimento no repositorio mantido.
```

Os tipos suportados sao `NOTE`, `TIP`, `IMPORTANT`, `WARNING` e `CAUTION`.
Blockquotes comuns (sem `[!TYPE]`) continuam funcionando normalmente.

### Atributos Customizados

O plugin `markdown-it-attrs` permite atributos customizados usando sintaxe `:attr;`. Blocos de código cercados suportam `filename`, `group`, `tab` e `breadcrumb`:

````markdown
```php :group="exemplo"; :tab="exemplo.php"; :breadcrumb="src > exemplo.php";
echo "Exemplo";
```
```bash :group="exemplo"; :tab="exemplo.sh"; :breadcrumb="scripts > exemplo.sh";
echo "Exemplo"
```
````

`filename` aparece na barra de info em blocos simples. Fences consecutivos com o mesmo `group` são renderizados como abas. `tab` define o rótulo da aba, então labels que parecem arquivo, como `exemplo.php`, recebem ícones na aba. `breadcrumb` define os segmentos acima do bloco ativo, e o segmento final que parece arquivo recebe o mesmo ícone.

### Conteúdo Expansível

Use `<d-expandable>` para esconder conteúdo secundário sem perder os recursos ricos de Markdown da página:

```markdown
<d-expandable title="Mais detalhes">

Explicações opcionais, notas operacionais ou exemplos maiores.

</d-expandable>
```

Defina `open="true"` quando o bloco precisar começar aberto.

O corpo do expansível suporta parágrafos, listas, alertas, blocos de código, diagramas Mermaid, tabelas, HTML bruto e quick links. Nesta primeira versão, mantenha títulos fora do bloco expansível, porque títulos dentro do corpo viram parágrafos comuns para preservar o ToC da página.

## Adicionando um Novo Idioma

1. Crie `src/i18n/languages/xx-XX.hjson` com todas as traduções de UI
2. Adicione o idioma ao array languages em `docsector.config.js`
3. Adicione o locale ao array langs em `src/i18n/index.js`
4. Crie arquivos `.md` para cada página com o sufixo do novo locale
5. Adicione uma imagem de bandeira em `public/images/flags/`

## Plugin Vite para HJSON

O Docsector inclui um plugin Vite customizado que transforma imports HJSON em JSON no build. Isso é configurado automaticamente em `quasar.config.js` — nenhuma configuração adicional necessária.
