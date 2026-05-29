## Showcase

### JSON do Quasar Sem Refatoração

Este exemplo renderiza um arquivo JSON de API real do Quasar copiado para `public/quasar-api/`.

<d-block-api src="/quasar-api/QSeparator.json" />

### JSON de SDK Genérico Com o Mesmo Schema

Este exemplo usa o mesmo modelo de seções para um cliente HTTP não-Vue e também ativa o botão opcional de Docs.

<d-block-api src="/api/manual/http-client.json" title="HTTP Client API" page-link="true" />

## Sintaxe de Autoria

```html
<d-block-api src="/quasar-api/QSeparator.json" />

<d-block-api
  src="/api/manual/http-client.json"
  title="HTTP Client API"
  page-link="true"
/>
```

## Recursos Visíveis Acima

- **Compatibilidade com JSON do Quasar** usando um arquivo real servido de `public/quasar-api/`
- **Suporte a APIs genéricas** sem introduzir um novo schema
- **Filtro local** por nomes e descrições dentro das seções carregadas
- **Subtabs agrupadas em props** quando múltiplas categorias existem no JSON
- **Link opcional para Docs** quando `meta.docsUrl` está presente e `page-link="true"` é usado