## Demonstração

Aqui estão blocos de código em diferentes linguagens demonstrando o componente DPageSourceCode:

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

## Funcionalidades Visíveis Acima

- **Números de linha** no lado esquerdo de blocos multi-linha
- **Label de linguagem** no canto superior direito
- **Botão de cópia** ao lado do label de linguagem
- **Syntax highlighting** com coloração específica por linguagem
