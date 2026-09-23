## Visão Geral

O Feedback da Página adiciona ao rodapé a pergunta **"Esta página foi útil?"**, com três carinhas: verde para útil, amarela para mais ou menos útil e vermelha para não foi útil. O leitor escolhe uma e o rodapé agradece. Escolher outra carinha troca o voto, e escolher a mesma de novo cancela.

Cada voto é enviado a uma pequena Cloudflare Pages Function que o Docsector gera no build. A function grava o voto num dataset do Workers Analytics Engine, e você pode consultar esse dataset com SQL para ver quais páginas ajudam os leitores e quais precisam de trabalho.

O recurso é **opt-in**: a pergunta só aparece quando você o habilita.

## Habilitando

Adicione um bloco `feedback` ao `docsector.config.js`:

```js
feedback: {
  enabled: true
}
```

No próximo `docsector build`, o Docsector escreve `functions/feedback.js` e roteia `/feedback` para ela no `_routes.json`.

## Vinculando o Dataset

A function grava num binding do Analytics Engine chamado `FEEDBACK`. Adicione-o ao seu projeto Pages uma vez:

1. No dashboard da Cloudflare, abra **Workers & Pages**, selecione o projeto Pages e vá em **Settings → Bindings**.
2. Adicione um binding **Analytics Engine**. Defina o nome da variável como `FEEDBACK` e escolha um nome de dataset, por exemplo `docs_feedback`.
3. Faça um novo deploy do projeto.

Os bindings são definidos por ambiente: adicione em **Production** e em **Preview**, ou os votos nos deploys de preview são recusados.

Se você gerencia o projeto com o Wrangler, declare o mesmo binding no `wrangler.toml` (o Pages só lê um `wrangler.toml` que define `pages_build_output_dir`):

```toml
[[analytics_engine_datasets]]
binding = "FEEDBACK"
dataset = "docs_feedback"
```

O dataset é criado na primeira escrita, então não há mais nada a configurar.

## Lendo os Resultados

Consulte o dataset pela SQL API do Analytics Engine. O token da API precisa da permissão **Account Analytics: Read**:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "SELECT blob1 AS page, blob2 AS locale, SUM(_sample_interval * double2) AS votes, SUM(_sample_interval * double1) / SUM(_sample_interval * double2) AS score FROM docs_feedback WHERE timestamp > NOW() - INTERVAL '30' DAY GROUP BY blob1, blob2 HAVING SUM(_sample_interval * double2) > 0 ORDER BY votes DESC"
```

`votes` é o número de votos em vigor e o `score` vai de `-1` (todos os votos são "não foi útil") a `1` (todos são "útil"). Um voto trocado ou cancelado é gravado como um ponto compensatório com contagem negativa, por isso a consulta soma `double2` em vez de contar linhas. Multiplicar por `_sample_interval` mantém os números corretos quando o Analytics Engine amostra um dataset movimentado.

Para ver como os votos se dividem, agrupe pela avaliação:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "SELECT blob1 AS page, blob4 AS rating, SUM(_sample_interval * double2) AS votes FROM docs_feedback WHERE timestamp > NOW() - INTERVAL '30' DAY GROUP BY blob1, blob4 ORDER BY page, votes DESC"
```

O Analytics Engine guarda os dados por três meses, então exporte o que quiser manter por mais tempo.

## Como os Votos se Comportam

- Um navegador tem **um voto por página, locale e versão da documentação**. Escolher outra carinha substitui o voto, e escolher a mesma de novo cancela.
- O voto gravado fica salvo no `localStorage` em `docsector.feedback.*`, então o rodapé continua mostrando o voto depois de recarregar. Ele só é salvo quando a function aceita: se um envio falha, o leitor pode votar de novo depois de recarregar.
- A pergunta fica oculta em páginas com status `empty`, porque ainda não há o que avaliar.
- Um voto que falha ao enviar nunca mostra erro ao leitor. A function registra no log um voto recusado (com o nome do campo inválido), um binding ausente e uma escrita que falhou; erros de rede não vão para o log.
- Só são aceitas as versões da documentação e os locales que o build conhece, então os votos sempre batem com suas listas de versões e idiomas.
- Os votos só são gravados onde a function gerada roda, ou seja, no Cloudflare Pages. No `docsector dev` a requisição recebe 404 e o widget continua funcionando.

## Nome de Binding Personalizado

Para usar outro nome de binding que não `FEEDBACK`, defina `binding`:

```js
feedback: {
  enabled: true,
  binding: 'DOCS_VOTES'
}
```

## Textos

Sobrescreva as chaves `page.feedback` nos seus arquivos de idioma para mudar os textos:

```hjson
page: {
  feedback: {
    question: 'Esta página te ajudou?'
    thanks: 'Obrigado!'
  }
}
```

## Referência

### Configuração

```js
feedback: {
  enabled: false,
  binding: 'FEEDBACK'
}
```

| Chave | Padrão | Descrição |
|-------|--------|-----------|
| `enabled` | `false` | Mostra a pergunta e gera `functions/feedback.js`. Só um `true` literal habilita. |
| `binding` | `'FEEDBACK'` | Nome do binding do Analytics Engine em que a function grava. |

### Data point

Um voto é um data point. Cancelar um voto grava um ponto compensatório, e trocar um voto grava os dois:

| Campo | Conteúdo |
|-------|----------|
| `index1` | Caminho da página, primeiros 96 bytes (a chave de amostragem) |
| `blob1` | Caminho da página, por exemplo `/manual/basic/footer/overview` |
| `blob2` | Locale, por exemplo `pt-BR` |
| `blob3` | Id da versão da documentação, por exemplo `v4.25.0` |
| `blob4` | Avaliação: `positive`, `neutral` ou `negative` |
| `blob5` | Ação: `vote`, ou `undo` para um ponto compensatório |
| `double1` | Nota: `1`, `0` ou `-1` para um voto; a nota negada para `undo` |
| `double2` | Contagem: `1` para um voto, `-1` para `undo` |

### Endpoint

```http
POST /feedback
Content-Type: application/json

{ "path": "/manual/basic/footer/overview", "locale": "pt-BR", "version": "v4.25.0", "rating": "positive", "previous": "negative" }
```

`rating` é o voto novo e `previous` o voto gravado que ele substitui. Qualquer um pode ser `null` (um primeiro voto, um cancelamento), mas não os dois. A function só aceita a requisição quando as avaliações são conhecidas, o caminho é um caminho do site com no máximo 256 caracteres de caminho de URL, o locale e a versão são conhecidos pelo build e o corpo tem no máximo 1 KB de `application/json`.

| Status | Significado |
|--------|-------------|
| `204` | Voto gravado. |
| `400` | JSON inválido ou voto inválido (vai para o log com o nome do campo). |
| `403` | O navegador enviou o voto a partir de outro site. |
| `413` | O corpo passa de 1 KB. |
| `415` | O corpo não é `application/json`. |
| `500` | O dataset recusou a escrita. |
| `503` | O binding `FEEDBACK` não existe. |

### Chaves de idioma

| Chave | Português |
|-------|-----------|
| `page.feedback.question` | Esta página foi útil? |
| `page.feedback.thanks` | Obrigado pelo seu feedback! |
| `page.feedback.positive` | Útil |
| `page.feedback.neutral` | Mais ou menos útil |
| `page.feedback.negative` | Não foi útil |
| `page.feedback.undo` | Clique de novo para desfazer |
