## Visão geral

O rodapé exibe o crédito "Powered by Docsector" na base de todas as páginas.

Acima desse crédito, você pode opcionalmente mostrar uma linha de links legais / de compliance — Privacidade, Cookies, Marca, Segurança, Licença e o que mais o seu projeto precisar. Abaixo dele, você pode opcionalmente mostrar o aviso de copyright do seu projeto.

Ambos são **opt-in**: eles só aparecem quando você os configura.

## Adicionando links legais

Adicione um array `footer.legalLinks` ao `docsector.config.js`:

```js
footer: {
  legalLinks: [
    { href: 'https://example.com/legal/privacy', label: 'Privacidade' },
    { href: 'https://example.com/legal/cookies', label: 'Cookies' },
    { href: 'https://example.com/legal/license', label: 'Licença' }
  ]
}
```

Cada link é renderizado em uma linha centralizada logo acima da linha "Powered by", separado por pontos, e quebra em várias linhas em telas estreitas.

## Rótulos localizados

Um `label` pode ser uma string simples ou um mapa por locale, resolvido para o idioma atual do leitor:

```js
footer: {
  legalLinks: [
    { href: 'https://example.com/legal/privacy', label: { 'en-US': 'Privacy', 'pt-BR': 'Privacidade' } },
    { href: 'https://example.com/legal/security', label: { 'en-US': 'Security', 'pt-BR': 'Segurança' } }
  ]
}
```

Quando o idioma ativo não está no mapa, o rótulo cai para `*`, depois `en-US` e, por fim, o primeiro valor.

## Adicionando um aviso de copyright

Adicione uma string `footer.copyright` ao `docsector.config.js` e ela é renderizada em sua própria linha, logo abaixo do crédito "Powered by":

```js
footer: {
  copyright: 'Copyright (c) 2023-present Example Corp. and contributors'
}
```

O texto é renderizado exatamente como escrito — o Docsector não adiciona o símbolo `©` nem substitui o ano atual, então o que você configura é o que os leitores veem.

Como os rótulos de link, o valor também pode ser um mapa por locale:

```js
footer: {
  copyright: {
    'en-US': '© 2023-present Example Corp. All rights reserved.',
    'pt-BR': '© 2023-presente Example Corp. Todos os direitos reservados.'
  }
}
```

## O que os leitores percebem

- Acesso rápido a Privacidade, Cookies e outras páginas de compliance
- Os links ficam em sua própria linha, logo acima do crédito do Docsector
- O aviso de copyright fica em sua própria linha, logo abaixo do crédito do Docsector
- Os rótulos e o copyright seguem o idioma atual do leitor
- Passar o mouse no botão do Docsector revela a versão do engine e o build do deploy — útil para confirmar qual build está realmente no ar ao rastrear um problema de deploy

## Notas

- Deixe `legalLinks` vazio (ou omita `footer`) para esconder a linha por completo; omita `copyright` para esconder a linha de copyright.
- URLs absolutas `http(s)` abrem em uma nova aba automaticamente; use `external: true` para forçar uma nova aba em qualquer outro `href`.
- Mantenha os rótulos curtos — rótulos longos fazem a linha quebrar antes no mobile.
- O tooltip de versão mostra a versão do Docsector Reader que construiu o site e o ID do build (o commit SHA do deploy no Cloudflare Pages, exibido no formato curto do git). Não precisa de configuração.

## Referência

```js
footer: {
  legalLinks: Array<{ href: string, label?: string | Record<string, string>, external?: boolean }>,
  copyright: string | Record<string, string>
}
```

A configuração da funcionalidade de rodapé.

- `footer.legalLinks` — array de links legais. Vazio ou ausente esconde a linha.
- `href` — destino do link (URL absoluta recomendada para políticas externas).
- `label` — texto exibido: uma string ou um mapa `{ locale: texto }`. Usa o `href` como padrão quando omitido.
- `external` — força a abertura em uma nova aba. Inferido como `true` para URLs `http(s)`.
- `footer.copyright` — aviso de copyright abaixo do crédito "Powered by": uma string ou um mapa `{ locale: texto }` (mesma ordem de fallback dos rótulos). Ausente esconde a linha. Exige o Docsector Reader 4.23.0 ou mais novo.
