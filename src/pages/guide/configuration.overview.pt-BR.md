## docsector.config.js

O arquivo `docsector.config.js` na raiz do projeto controla todas as configurações específicas. Este é o **único arquivo** que você precisa customizar para personalizar seu site de documentação.

## Branding

```javascript
branding: &#123;
  logo: '/images/logo.png',   // Caminho do logo em public/
  name: 'Meu Projeto',        // Nome exibido na sidebar
  version: 'v1.0.0',          // Badge de versão atual
  versions: ['v1.0.0']        // Opções do dropdown de versão
&#125;
```

O caminho do `logo` é relativo à pasta `public/`. Tamanho recomendado: **85×85px**.

## Links

```javascript
links: &#123;
  github: 'https://github.com/org/repo',
  discussions: 'https://github.com/org/repo/discussions',
  chat: 'https://discord.gg/seu-convite',
  email: 'docs@example.com',
  changelog: '/changelog',
  roadmap: '/roadmap',
  sponsor: 'https://github.com/sponsors/org',
  explore: [
    &#123; label: 'Website', url: 'https://example.com' &#125;,
    &#123; label: 'Blog', url: 'https://blog.example.com' &#125;
  ]
&#125;
```

Defina qualquer link como `null` para ocultá-lo do menu lateral.

## Integração com GitHub

```javascript
github: &#123;
  editBaseUrl: 'https://github.com/org/docs/edit/main/src/pages'
&#125;
```

Esta URL é usada pelo componente **DPageMeta** para gerar links "Editar no GitHub". O caminho da página e o idioma são adicionados automaticamente.

## Idiomas

```javascript
languages: [
  &#123;
    image: '/images/flags/united-states-of-america.png',
    label: 'English (US)',
    value: 'en-US'
  &#125;,
  &#123;
    image: '/images/flags/brazil.png',
    label: 'Português (BR)',
    value: 'pt-BR'
  &#125;
]
```

Cada idioma precisa de:

- Uma **imagem de bandeira** em `public/images/flags/`
- Um **arquivo HJSON de locale** em `src/i18n/languages/`
- **Arquivos .md** correspondentes para cada página

## Idioma Padrão

```javascript
defaultLanguage: 'en-US'
```

O idioma usado quando nenhuma preferência está armazenada no navegador do usuário.

## Exemplo Completo

```javascript
export default &#123;
  branding: &#123;
    logo: '/images/logo.png',
    name: 'Acme Docs',
    version: 'v2.1.0',
    versions: ['v2.1.0', 'v2.0.0', 'v1.0.0']
  &#125;,
  links: &#123;
    github: 'https://github.com/acme/acme',
    discussions: 'https://github.com/acme/acme/discussions',
    chat: null,
    email: 'hello@acme.dev',
    changelog: null,
    roadmap: null,
    sponsor: null,
    explore: null
  &#125;,
  github: &#123;
    editBaseUrl: 'https://github.com/acme/docs/edit/main/src/pages'
  &#125;,
  languages: [
    &#123; image: '/images/flags/united-states-of-america.png', label: 'English', value: 'en-US' &#125;
  ],
  defaultLanguage: 'en-US'
&#125;
```
