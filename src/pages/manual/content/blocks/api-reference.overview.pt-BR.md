## Visão geral

Os blocos de Referência de API renderizam um documento JSON que segue o schema de API já existente do Quasar diretamente dentro do Markdown.

Isso mantém o viewer compatível com arquivos de API no estilo do Quasar e ainda permite que APIs não-Vue reutilizem o mesmo modelo de seções para props, methods, events, values, arguments e estruturas de configuração.

O bloco é escrito com o elemento Markdown customizado `<d-block-api>`.

## Sintaxe Markdown

```html
<d-block-api src="/quasar-api/QSeparator.json" />

<d-block-api
  src="/api/manual/http-client.json"
  title="HTTP Client API"
  page-link="true"
/>
```

## Atributos

| Atributo | Finalidade |
|----------|------------|
| `src` | Caminho same-origin do JSON a ser buscado no navegador |
| `title` | Sobrescreve opcionalmente o título exibido acima do card |
| `page-link` | Exibe o botão Docs quando o JSON possui `meta.docsUrl` |

## Modelo da Fonte JSON

- A primeira implementação segue o mesmo modelo de entrega do Quasar Docs: o arquivo JSON é servido como asset público e carregado sob demanda.
- Nenhum schema específico do Docsector é exigido. Se o arquivo já seguir a estrutura de API do Quasar, ele pode ser renderizado sem alterações.
- APIs não-Vue ainda podem usar a mesma forma preenchendo apenas as seções necessárias, como `props`, `methods`, `events`, `value`, `arg` ou `quasarConfOptions`.

## Notas

- `props` são agrupadas em subtabs quando mais de uma `category` está presente.
- Entradas marcadas com `internal: true` são ocultadas do bloco renderizado.
- A versão atual espera assets JSON same-origin para que o navegador faça o fetch sem workarounds de CORS.
- Se o JSON expuser `meta.docsUrl`, `page-link="true"` pode exibir um botão Docs sem alterar o schema.