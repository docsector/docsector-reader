## Showcase

### Contador básico

Este exemplo é renderizado a partir de um SFC Vue real em `src/examples/manual/code-examples/BasicCounter.vue`.

<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter">
Use o botão de fonte para inspecionar as seções do SFC, ou abra a demo compatível no CodePen.
</d-block-code-example>

### Fonte expandida por padrão

Use `expanded="true"` quando o código fonte faz parte da explicação e deve aparecer assim que o leitor chegar ao exemplo.

<d-block-code-example src="manual/code-examples/inline-notice" title="Expanded source example" expanded="true">
Este exemplo intencionalmente começa com o painel de fonte aberto.
</d-block-code-example>

## Sintaxe de autoria

```html
<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter">
Legenda opcional renderizada como Markdown inline.
</d-block-code-example>

<d-block-code-example src="manual/code-examples/inline-notice" title="Expanded source example" expanded="true">
O painel de fonte começa aberto.
</d-block-code-example>
```

## Recursos visíveis acima

- **Preview ao vivo** renderizado a partir do componente Vue empacotado
- **Alternância de fonte** com abas Template, Script, Style e All
- **Ação do CodePen** para exemplos compatíveis
- **Ação do GitHub** apontando para o SFC do exemplo
- **Estado de fonte expandida** com `expanded="true"`
- **Legenda em Markdown inline** abaixo do preview