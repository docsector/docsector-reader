## Visão geral

O rodapé exibe o crédito "Powered by Docsector" na base de todas as páginas.

Acima desse crédito, você pode opcionalmente mostrar uma linha de links legais / de compliance — Privacidade, Cookies, Marca, Segurança, Licença e o que mais o seu projeto precisar.

A linha é **opt-in**: ela só aparece quando você configura pelo menos um link.

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

## O que os leitores percebem

- Acesso rápido a Privacidade, Cookies e outras páginas de compliance
- Os links ficam em sua própria linha, logo acima do crédito do Docsector
- Os rótulos seguem o idioma atual do leitor

## Notas

- Deixe `legalLinks` vazio (ou omita `footer`) para esconder a linha por completo.
- URLs absolutas `http(s)` abrem em uma nova aba automaticamente; use `external: true` para forçar uma nova aba em qualquer outro `href`.
- Mantenha os rótulos curtos — rótulos longos fazem a linha quebrar antes no mobile.

## Referência

```js
footer: {
  legalLinks: Array<{ href: string, label?: string | Record<string, string>, external?: boolean }>
}
```

A configuração da funcionalidade de rodapé.

- `footer.legalLinks` — array de links legais. Vazio ou ausente esconde a linha.
- `href` — destino do link (URL absoluta recomendada para políticas externas).
- `label` — texto exibido: uma string ou um mapa `{ locale: texto }`. Usa o `href` como padrão quando omitido.
- `external` — força a abertura em uma nova aba. Inferido como `true` para URLs `http(s)`.
