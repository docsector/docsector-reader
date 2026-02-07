# Deploy

## Visão Geral

Este guia cobre como fazer o deploy do seu site de documentação Docsector Reader em ambientes de produção.

## Build de Produção

Execute o comando de build para gerar os arquivos estáticos otimizados:

```bash
npx quasar build
```

A saída será colocada em `dist/spa/`. Esta pasta contém tudo necessário para servir sua documentação.

## Hospedagem Estática

Como o Docsector Reader é uma Single Page Application (SPA), você pode hospedá-lo em qualquer servidor de arquivos estáticos:

- **GitHub Pages**
- **Netlify**
- **Vercel**
- **AWS S3 + CloudFront**
- **Qualquer servidor web** (Nginx, Apache, etc.)

## Roteamento SPA

Ao usar o Vue Router em modo `history`, configure seu servidor para redirecionar todas as requisições para `index.html`:

### Nginx

```bash
location / {
  try_files $uri $uri/ /index.html;
}
```

### Netlify

Crie um arquivo `_redirects` em `public/`:

```bash
/*    /index.html   200
```

## Variáveis de Ambiente

> Esta seção ainda está sendo escrita. Volte em breve para detalhes sobre configurações específicas por ambiente.
