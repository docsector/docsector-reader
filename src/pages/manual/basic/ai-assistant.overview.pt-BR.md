## Visão Geral

O AI Assistant adiciona um painel opcional de chat às páginas do Docsector. Ele foi desenhado para fluxos de RAG semântico na Cloudflare, mantendo a integração do navegador simples: usuários abrem um drawer pelo header global, e a Cloudflare Pages Function conversa com o provedor de IA configurado.

O primeiro provedor é o Cloudflare AI Search. Ele pode rastrear o sitemap Markdown gerado pelo Docsector, recuperar trechos relevantes com busca híbrida e transmitir uma resposta com trechos de origem que o painel mostra como citações.

## O Que Ele Adiciona

- Um drawer lateral direito no desktop.
- Um diálogo em tela cheia no mobile.
- Prompts sugeridos, contexto opcional da página atual, respostas em streaming e links de fontes.
- As respostas são renderizadas em Markdown, e os code blocks delas sempre trazem o rótulo da linguagem e o botão de copiar.
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
      instanceNameEnv: 'AI_SEARCH_INSTANCE_NAME',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      retrievalType: 'hybrid',
      maxResults: 6,
      stream: true
    }
  }
}
```

Defina `AI_SEARCH_INSTANCE_NAME` nas variáveis de ambiente do Cloudflare Pages em deploy, ou em `.dev.vars` quando usar `wrangler pages dev` localmente.

## Contexto da Página

O composer tem um chip **Contexto da página**. Quando ligado, o Markdown completo da página que o leitor está vendo é anexado ao prompt, então o assistente consegue responder "resuma esta página" ou "o que isso significa?" com o texto na frente.

Ele vem **desligado por padrão**. A maior parte das perguntas não é sobre a página atual, e anexá-la mesmo assim gasta a janela de contexto do modelo com um texto que ninguém pediu. O leitor liga quando quer, e a escolha fica salva no `localStorage` em `docsector.assistant.context.v1`.

Desligado **não** significa que o assistente fica cego para a página. A busca continua rodando sobre toda a documentação indexada, e a página atual faz parte desse índice — o chip controla apenas a cópia *garantida e literal*. O título e a rota da página são sempre enviados, assim como qualquer texto que o leitor tenha selecionado.

Com o chip desligado, o endpoint pula a leitura do arquivo por completo, então a requisição fica mais barata e mais rápida, não apenas menor.

### Prompts que dependem da página

Um prompt sugerido que só faz sentido com a página anexada pode dizer isso. Clicar nele liga o chip, então o leitor vê o motivo:

```javascript
suggestedPrompts: [
  'Como eu começo?',
  { text: 'Resuma esta página.', pageContext: true },
  'Onde está a referência de API relacionada?'
]
```

As duas formas funcionam na mesma lista: uma string simples é um prompt que não precisa da página. A forma de objeto exige o Docsector Reader 4.17.0 ou mais novo — versões anteriores ignoram entradas em objeto.

Não existe chave de configuração para o padrão. Para mudar o texto do chip, sobrescreva `assistant.pageContext.label`, `assistant.pageContext.on` e `assistant.pageContext.off` nos seus arquivos de idioma.

## Cloudflare AI Search

Crie uma instância do AI Search e configure uma fonte de dados Website. O Docsector sempre publica `/sitemap.xml` no build e anuncia esse arquivo em `robots.txt`, então o crawler da Cloudflare consegue descobrir o site automaticamente.

Para uma recuperação mais limpa, aponte a configuração de sitemap específico para:

```text
https://docs.example.com/ai-search-sitemap.xml
```

O sitemap do AI Search aponta para URLs Markdown, que são mais limpas para recuperação do que HTML renderizado pela SPA. O Docsector mantém esse arquivo disponível para configuração explícita no Cloudflare, mas não o anuncia automaticamente em `robots.txt`, para evitar indexação duplicada junto com `/sitemap.xml`. O manifest em `/.well-known/ai-search/manifest.json` lista títulos, rotas, locales, books, versões e subpáginas do mesmo conjunto de fontes.

## Endpoint Runtime

A Pages Function gerada aceita mensagens de chat, metadados da rota atual, locale, texto selecionado opcional e a flag de contexto da página. Ela lê o Markdown da página atual dos assets publicados apenas quando essa flag está ligada, e então encaminha a solicitação ao AI Search por binding quando disponível, ou por REST usando variáveis de ambiente criptografadas da Cloudflare. O endpoint é uma API interna do drawer, não uma página para o usuário navegar.

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