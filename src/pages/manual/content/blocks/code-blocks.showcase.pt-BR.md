## Demonstração

Aqui estão blocos de código em diferentes linguagens mostrando como o Docsector renderiza exemplos técnicos:

### Exemplo PHP

```php
class HelloWorld
&#123;
    public function greet(string $name): string
    &#123;
        return "Olá, &#123;$name&#125;!";
    &#125;
&#125;

$hello = new HelloWorld();
echo $hello->greet('Docsector');
```

### Exemplo Bash

```bash
#!/bin/bash
echo "Instalando Docsector Reader..."
npm install
npx quasar dev
echo "Servidor rodando em http://localhost:8181"
```

### Exemplo HTML

```html
<template>
  <d-page>
    <header>
      <d-h1 :id="0" />
    </header>
    <main>
      <d-page-section :id="id" />
    </main>
  </d-page>
</template>
```

### Exemplo com Abas

```php :group="ola-mundo"; :tab="OlaMundo.php"; :breadcrumb="src > examples > OlaMundo.php";
class OlaMundo
&#123;
  public function saudar(): string
  &#123;
    return 'Ola de um bloco de codigo com abas';
  &#125;
&#125;
```
```bash :group="ola-mundo"; :tab="ola-mundo.sh"; :breadcrumb="scripts > ola-mundo.sh";
#!/bin/bash
echo "Ola de um bloco de codigo com abas"
```

### Breadcrumb sem Abas

```javascript :breadcrumb="src > boot > i18n.js";
import { createI18n } from 'vue-i18n'

export default ({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: 'pt-BR',
    fallbackLocale: 'en-US'
  })

  app.use(i18n)
}
```

### Breadcrumb Gigante

```javascript :breadcrumb="workspace-com-nome-muito-longo > pacotes > renderizador-de-documentacao-com-nome-longo > src > componentes > source-code > previews > exemplos-profundamente-aninhados > ExemploBreadcrumbGigante.vue";
console.log('Exemplo de breadcrumb gigante')
```

### Exemplo Longo com Abas

```php :group="exemplo-longo"; :tab="rotas.php"; :breadcrumb="src > rotas > rotas.php";
return [
  '/overview' => 'PaginaVisaoGeral',
  '/getting-started' => 'PaginaPrimeirosPassos',
  '/configuration' => 'PaginaConfiguracao',
  '/deployment' => 'PaginaDeploy',
  '/plugins' => 'PaginaPlugins',
  '/theming' => 'PaginaTemas',
  '/basic' => 'PaginaBasico',
  '/basic/d-menu' => 'MenuDeNavegacaoVisaoGeral',
  '/basic/d-page-anchor' => 'IndiceDaPaginaVisaoGeral',
  '/basic/d-page-meta' => 'RodapeDaPaginaVisaoGeral',
  '/content/structures/page' => 'PaginaVisaoGeral',
  '/content/blocks' => 'SecaoBlocos',
  '/content/blocks/paragraphs' => 'ParagrafosVisaoGeral',
  '/content/blocks/headings' => 'TitulosVisaoGeral',
  '/content/blocks/code-blocks' => 'BlocosDeCodigoVisaoGeral',
  '/content/blocks/mermaid-diagrams' => 'DiagramasMermaidVisaoGeral',
  '/content/blocks/quotes' => 'CitacaoVisaoGeral',
  '/content/blocks/expandable' => 'ExpansivelVisaoGeral',
  '/content/blocks/quick-links' => 'QuickLinksVisaoGeral',
  '/guide' => 'IndiceGuia',
  '/guide/markdown' => 'GuiaMarkdown',
  '/guide/i18n' => 'GuiaI18n',
  '/guide/routing' => 'GuiaRotas',
  '/guide/search' => 'GuiaBusca',
  '/guide/api' => 'GuiaApi',
  '/guide/mcp' => 'GuiaMcp',
  '/guide/releases' => 'GuiaReleases',
  '/guide/changelog' => 'GuiaChangelog',
];
```
```bash :group="exemplo-longo"; :tab="deploy.sh"; :breadcrumb="scripts > deploy.sh";
#!/bin/bash
set -euo pipefail

steps=(
  "instalar dependencias"
  "checar formatacao"
  "rodar lint"
  "rodar verificacoes"
  "gerar assets estaticos"
  "gerar paginas markdown"
  "gerar catalogo api"
  "gerar metadados mcp"
  "escrever headers"
  "escrever rotas"
  "empacotar assets"
  "publicar preview"
  "verificar preview"
  "promover release"
  "notificar mantenedores"
)

for step in "${steps[@]}"; do
  echo "Executando: ${step}"
done
```

## Funcionalidades Visíveis Acima

- **Números de linha** no lado esquerdo de blocos multi-linha
- **Label de linguagem** no canto superior direito
- **Botão de cópia** ao lado do label de linguagem
- **Abas** para blocos de código consecutivos com o mesmo grupo
- **Breadcrumbs** acima de exemplos de código agrupados
- **Breadcrumbs sem abas** para blocos de código simples
- **Breadcrumbs longos condensados** que truncam antes de colidir com os controles de metadados
- **Ícones de arquivo** antes de labels de aba e segmentos finais de breadcrumb que parecem arquivos
- **Linha de metadados sticky** em exemplos longos agrupados
- **Syntax highlighting** com coloração específica por linguagem
