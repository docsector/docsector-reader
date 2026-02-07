# Deployment

## Overview

This guide covers how to deploy your Docsector Reader documentation site to production environments.

## Build for Production

Run the build command to generate optimized static files:

```bash
npx quasar build
```

The output will be placed in `dist/spa/`. This folder contains everything needed to serve your documentation.

## Static Hosting

Since Docsector Reader is a Single Page Application (SPA), you can host it on any static file server:

- **GitHub Pages**
- **Netlify**
- **Vercel**
- **AWS S3 + CloudFront**
- **Any web server** (Nginx, Apache, etc.)

## SPA Routing

When using Vue Router in `history` mode, configure your server to redirect all requests to `index.html`:

### Nginx

```bash
location / {
  try_files $uri $uri/ /index.html;
}
```

### Netlify

Create a `_redirects` file in `public/`:

```bash
/*    /index.html   200
```

## Environment Variables

> This section is still being written. Check back soon for details on configuring environment-specific settings.
