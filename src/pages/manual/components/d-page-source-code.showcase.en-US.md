## Showcase

Here are code blocks in different languages demonstrating the DPageSourceCode component:

### PHP Example

```php
class HelloWorld
&#123;
    public function greet(string $name): string
    &#123;
        return "Hello, &#123;$name&#125;!";
    &#125;
&#125;

$hello = new HelloWorld();
echo $hello->greet('Docsector');
```

### Bash Example

```bash
#!/bin/bash
echo "Installing Docsector Reader..."
npm install
npx quasar dev
echo "Server running at http://localhost:8181"
```

### HTML Example

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

### Tabbed Example

```php :group="hello-world"; :tab="HelloWorld.php"; :breadcrumb="src > examples > HelloWorld.php";
class HelloWorld
&#123;
  public function greet(): string
  &#123;
    return 'Hello from a tabbed code block';
  &#125;
&#125;
```
```bash :group="hello-world"; :tab="hello-world.sh"; :breadcrumb="scripts > hello-world.sh";
#!/bin/bash
echo "Hello from a tabbed code block"
```

### Breadcrumb Without Tabs

```javascript :breadcrumb="src > boot > i18n.js";
import { createI18n } from 'vue-i18n'

export default ({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en-US',
    fallbackLocale: 'en-US'
  })

  app.use(i18n)
}
```

### Long Breadcrumb

```javascript :breadcrumb="workspace-with-a-very-long-name > packages > documentation-renderer-with-a-long-name > src > components > source-code > previews > extremely-deeply-nested-examples > GiantBreadcrumbExample.vue";
console.log('Long breadcrumb example')
```

### Long Tabbed Example

```php :group="long-example"; :tab="routes.php"; :breadcrumb="src > routes > routes.php";
return [
  '/overview' => 'OverviewPage',
  '/getting-started' => 'GettingStartedPage',
  '/configuration' => 'ConfigurationPage',
  '/deployment' => 'DeploymentPage',
  '/plugins' => 'PluginsPage',
  '/theming' => 'ThemingPage',
  '/components' => 'ComponentsPage',
  '/components/d-page' => 'DPageOverview',
  '/components/d-page-section' => 'DPageSectionOverview',
  '/components/d-page-source-code' => 'DPageSourceCodeOverview',
  '/components/d-menu' => 'DMenuOverview',
  '/components/d-headings' => 'DHeadingsOverview',
  '/components/d-mermaid-diagram' => 'DMermaidDiagramOverview',
  '/components/d-page-blockquote' => 'DPageBlockquoteOverview',
  '/components/d-quick-links' => 'DQuickLinksOverview',
  '/manual' => 'ManualIndex',
  '/manual/showcase' => 'ManualShowcase',
  '/guide' => 'GuideIndex',
  '/guide/markdown' => 'MarkdownGuide',
  '/guide/i18n' => 'I18nGuide',
  '/guide/routing' => 'RoutingGuide',
  '/guide/search' => 'SearchGuide',
  '/guide/api' => 'ApiGuide',
  '/guide/mcp' => 'McpGuide',
  '/guide/releases' => 'ReleasesGuide',
  '/guide/changelog' => 'ChangelogGuide',
];
```
```bash :group="long-example"; :tab="deploy.sh"; :breadcrumb="scripts > deploy.sh";
#!/bin/bash
set -euo pipefail

steps=(
  "install dependencies"
  "check formatting"
  "run lint"
  "run unit checks"
  "build static assets"
  "generate markdown pages"
  "generate api catalog"
  "generate mcp metadata"
  "write headers"
  "write routes"
  "package assets"
  "publish preview"
  "verify preview"
  "promote release"
  "notify maintainers"
)

for step in "${steps[@]}"; do
  echo "Running: ${step}"
done
```

## Features Visible Above

- **Line numbers** on the left side of multi-line blocks
- **Language label** in the top-right corner
- **Copy button** next to the language label
- **Tabs** for consecutive code blocks with the same group
- **Breadcrumbs** above grouped code examples
- **Breadcrumbs without tabs** for single code blocks
- **Condensed long breadcrumbs** that truncate before colliding with the metadata controls
- **File icons** prepended to filename-like tab labels and final breadcrumb segments
- **Sticky metadata row** on long grouped code examples
- **Syntax highlighting** with language-specific coloring
