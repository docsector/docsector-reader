## Visão Geral

Quick Links renderizam uma lista de destinos internos ou externos em formato de cards diretamente no Markdown.

Eles são úteis para homepages, seções de entrada e qualquer página que precise oferecer próximos passos claros sem depender de uma longa lista de links em prosa.

## Sintaxe em Markdown

```html
<d-quick-links title="Comece aqui">
  <d-quick-link
    title="Instalação"
    description="Configure o projeto"
    to="/guide/getting-started"
  />
  <d-quick-link
    title="GitHub"
    description="Abra o repositório"
    href="https://github.com/docsector/docsector-reader"
  />
</d-quick-links>
```

## Observações

- Use `to` para navegação interna e `href` para URLs externas.
- Adicione descrições curtas para que os cards expliquem por que o destino importa.
- Use poucos links por grupo para manter a leitura fácil.