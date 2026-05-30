## Visão Geral

O AI Assistant adiciona um painel opcional de chat às páginas do Docsector. Ele foi desenhado para fluxos de RAG semântico na Cloudflare, mantendo a integração do navegador simples: usuários abrem um drawer pelo header global, e a Cloudflare Pages Function conversa com o provedor de IA configurado.

O primeiro provedor é o Cloudflare AI Search. Ele pode rastrear o sitemap Markdown gerado pelo Docsector, recuperar trechos relevantes com busca híbrida e transmitir uma resposta com trechos de origem que o painel mostra como citações.

## O Que Ele Adiciona

- Um drawer lateral direito no desktop.
- Um diálogo em tela cheia no mobile.
- Prompts sugeridos, contexto da página atual, respostas em streaming e links de fontes.
- Artefatos de build para AI Search quando `siteUrl` está configurado.
- Um endpoint interno same-origin para manter credenciais no servidor.

## Habilitar

```javascript
export default {
  siteUrl: 'https://docs.example.com',

  aiAssistant: {
    enabled: true,
    provider: 'aiSearch',
    endpoint: '/assistant',
    aiSearch: {
      binding: 'AI_SEARCH',
      instanceName: 'docs-search',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      retrievalType: 'hybrid',
      maxResults: 6,
      stream: true
    }
  }
}
```

## Cloudflare AI Search

Crie uma instância do AI Search e configure uma fonte de dados Website. O Docsector sempre publica `/sitemap.xml` no build e anuncia esse arquivo em `robots.txt`, então o crawler da Cloudflare consegue descobrir o site automaticamente.

Para uma recuperação mais limpa, aponte a configuração de sitemap específico para:

```text
https://docs.example.com/ai-search-sitemap.xml
```

O sitemap do AI Search aponta para URLs Markdown, que são mais limpas para recuperação do que HTML renderizado pela SPA. O manifest em `/.well-known/ai-search/manifest.json` lista títulos, rotas, locales, books, versões e subpáginas do mesmo conjunto de fontes.

## Endpoint Runtime

A Pages Function gerada aceita mensagens de chat, metadados da rota atual, locale e texto selecionado opcional. Ela encaminha a solicitação ao AI Search por binding quando disponível, ou por REST usando variáveis de ambiente criptografadas da Cloudflare. O endpoint é uma API interna do drawer, não uma página para o usuário navegar.

O navegador nunca precisa de um token da API Cloudflare.

## Validar

```bash
npx docsector build
cat dist/spa/sitemap.xml
cat dist/spa/robots.txt
cat dist/spa/ai-search-sitemap.xml
cat dist/spa/.well-known/ai-search/manifest.json
npx wrangler pages dev dist/spa
```

Bindings remotos de AI Search e Workers AI podem gerar uso cobrado pela Cloudflare durante o desenvolvimento local.