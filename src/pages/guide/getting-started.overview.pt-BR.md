## O que é o Docsector Reader?

Docsector Reader é um **motor de renderização de documentação** construído com Vue 3, Quasar v2 e Vite. Ele transforma conteúdo Markdown em um site de documentação bonito e navegável — com i18n, syntax highlighting, modo escuro e navegação por âncoras.

## Requisitos

- **Node.js** 18+ (LTS recomendado)
- **npm** 9+ ou **yarn** 1.22+
- Um emulador de terminal

## Instalação

Crie um novo projeto de documentação com o CLI:

```bash
npx @docsector/docsector-reader init my-docs
cd my-docs
npm install
```

Isso cria um projeto pronto para uso com todos os arquivos de configuração, um registro de páginas de exemplo e setup de i18n.

## Servidor de Desenvolvimento

Inicie o servidor dev com hot-reload:

```bash
npx docsector dev
```

O site de documentação estará disponível em **http://localhost:8181**.

Você também pode especificar uma porta personalizada:

```bash
npx docsector dev --port 3000
```

## Build de Produção

Gere um SPA otimizado para deploy:

```bash
npx docsector build
```

O output fica em `dist/spa/` — pronto para deploy em qualquer hosting estático.

Para visualizar a build de produção localmente:

```bash
npx docsector serve
```

## Estrutura do Projeto

Após o `init`, seu projeto terá esta estrutura:

- `docsector.config.js` — Branding, links, idiomas, config do GitHub
- `quasar.config.js` — Wrapper fino usando `createQuasarConfig()` do pacote
- `index.html` — Ponto de entrada HTML com título e meta tags
- `src/pages/index.js` — Registro de páginas (rotas e metadata)
- `src/pages/guide/` — Páginas tipo guia (arquivos Markdown)
- `src/pages/manual/` — Páginas tipo manual (arquivos Markdown)
- `src/i18n/index.js` — Loader i18n usando `buildMessages()` do pacote
- `src/i18n/tags.hjson` — Palavras-chave de busca por rota e idioma
- `public/` — Assets estáticos (logo, favicon, imagens)

O motor de renderização (componentes, layouts, router, store, composables) fica dentro do pacote `@docsector/docsector-reader` — você só mantém seu conteúdo e configuração.

## Próximos Passos

- Configure o branding do seu projeto em **docsector.config.js**
- Defina suas páginas em **src/pages/index.js**
- Escreva sua documentação em **Markdown**
- Adicione palavras-chave de busca em **src/i18n/tags.hjson**
- Personalize temas e aparência
