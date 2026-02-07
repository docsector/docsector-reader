## O que é o Docsector Reader?

Docsector Reader é um **motor de renderização de documentação** construído com Vue 3, Quasar v2 e Vite. Ele transforma conteúdo Markdown em um site de documentação bonito e navegável — com i18n, syntax highlighting, modo escuro e navegação por âncoras.

## Requisitos

- **Node.js** 18+ (LTS recomendado)
- **npm** 9+ ou **yarn** 1.22+
- Um emulador de terminal

## Instalação

```bash
npx degit docsector/docsector-reader my-docs
cd my-docs
npm install
```

## Servidor de Desenvolvimento

Inicie o servidor dev com hot-reload:

```bash
npx quasar dev
```

O site de documentação estará disponível em **http://localhost:8181**.

## Build de Produção

Gere um SPA otimizado para deploy:

```bash
npx quasar build
```

O output fica em `dist/spa/` — pronto para deploy em qualquer hosting estático.

## Estrutura do Projeto

O projeto segue o layout padrão do Quasar v2 com convenções específicas para documentação:

- `docsector.config.js` — Branding, links, idiomas
- `src/pages/index.js` — Registro de páginas (rotas e metadata)
- `src/pages/guide/` — Páginas tipo guia (arquivos Markdown)
- `src/pages/manual/` — Páginas tipo manual (arquivos Markdown)
- `src/components/` — Componentes Vue do Docsector
- `src/composables/` — Composables Vue (useNavigator)
- `src/store/` — Módulos Vuex 4
- `src/i18n/` — Arquivos de idioma (.hjson) e loader
- `src/layouts/` — DefaultLayout e SystemLayout
- `src/boot/` — Boot files (store, i18n, QZoom, axios)

## Próximos Passos

- Configure o branding do seu projeto em **docsector.config.js**
- Defina suas páginas em **src/pages/index.js**
- Escreva sua documentação em **Markdown**
- Personalize temas e aparência
