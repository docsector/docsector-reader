## Visão Geral

HTML bruto pode ser usado dentro do Markdown quando a sintaxe nativa de Markdown não é expressiva o suficiente.

Isso é útil para wrappers customizados, labels inline, elementos embutidos e custom elements do Docsector, como blocos expansíveis e quick links.

## Exemplo em Markdown

```html
<div data-kind="secondary-note">
  Este bloco usa HTML bruto dentro do conteúdo da página.
</div>
```

## Observações

- Prefira Markdown puro primeiro quando ele já resolver o problema.
- Use HTML bruto quando precisar de estrutura ou atributos que o Markdown não oferece.
- Mantenha a marcação legível, porque o conteúdo da documentação ainda precisa ser mantido por pessoas.