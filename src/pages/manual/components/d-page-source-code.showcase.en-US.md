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

## Features Visible Above

- **Line numbers** on the left side of multi-line blocks
- **Language label** in the top-right corner
- **Copy button** next to the language label
- **Syntax highlighting** with language-specific coloring
