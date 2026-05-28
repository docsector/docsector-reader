## Apresentação

URLs embutidas transformam links públicos suportados em embeds responsivos diretamente dentro das páginas Markdown.

Este block é uma alternativa de nível mais alto ao uso manual de iframe quando a origem pertence a um provider suportado e a página deve manter um tratamento consistente de preview + card.

## Sintaxe Markdown

```html
<d-block-embedded-url url="https://www.youtube.com/watch?v=M7lc1UVf-VE" title="Demo do player do YouTube">
Legenda opcional renderizada como Markdown inline.
</d-block-embedded-url>
```

Você também pode omitir o corpo quando o preview do provider já entrega contexto suficiente:

```html
<d-block-embedded-url url="https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P" />
```

## Providers suportados

- YouTube
- Vimeo
- Spotify
- CodePen

## Observações

- `url` é obrigatório. `title` é opcional.
- O block preserva a query string original, então opções do provider como `autoplay=1&loop=1` continuam funcionando quando houver suporte.
- URLs não suportadas ou privadas fazem fallback para um card seguro com link externo, sem tentar um iframe genérico.
- Use HTML bruto quando você precisar de um provider fora da lista curada ou de controle manual total sobre o iframe.