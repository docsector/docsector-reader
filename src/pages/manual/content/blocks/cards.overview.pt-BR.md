## Visão geral

Cards renderizam uma grade responsiva de blocos com link diretamente dentro do Markdown.

Eles são úteis para seções de entrada, listas curadas de recursos e qualquer lugar em que uma lista simples de links fique visualmente pobre.

## Sintaxe Markdown

```html
<d-block-cards title="Explore mais">
  <d-block-card
    title="Instalação"
    description="Configure o projeto"
    to="/guide/getting-started"
    image="/images/cards/getting-started-cover.svg"
  />
  <d-block-card
    title="GitHub"
    description="Abra o repositório"
    href="https://github.com/docsector/docsector-reader"
    icon="launch"
  />
</d-block-cards>
```

## Notas

- Use `to` para navegação interna e `href` para URLs externas.
- Adicione `image` quando o card precisar se comportar mais como um bloco de landing page.
- Adicione `icon` quando o card não tiver imagem, mas ainda precisar de uma pista visual mais forte.
- Descrições curtas funcionam melhor do que textos longos.
- Imagens de capa ficam melhores em formatos largos, como 16:9.