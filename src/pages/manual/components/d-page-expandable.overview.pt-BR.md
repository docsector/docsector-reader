## Visão Geral

`DPageExpandable` renderiza uma seção recolhível baseada no elemento customizado de Markdown `<d-expandable>`.

Ele foi criado para conteúdo secundário que deve continuar disponível sem alongar o fluxo principal de leitura. O corpo mantém os mesmos recursos ricos de Markdown já usados nas seções da página, incluindo listas, blockquotes, blocos de código, diagramas Mermaid, tabelas, HTML bruto e quick links.

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `title` | `String` | `''` | Rótulo do cabeçalho exibido no gatilho do expansível |
| `open` | `Boolean` | `false` | Estado inicial expandido |

## Slot

O slot padrão recebe o corpo de conteúdo já parseado.

## Exemplo em HTML

O custom element pode ser escrito diretamente no Markdown da página:

````html
<d-expandable title="Por que esconder este conteúdo?">

Use blocos expansíveis quando a seção principal deve continuar concisa, mas o leitor ainda pode precisar de mais detalhes.

</d-expandable>

### Aberto por Padrão

<d-expandable title="Checklist de release" open="true">

- Revisar breaking changes
- Atualizar screenshots
- Rodar smoke tests

</d-expandable>

### Conteúdo Rico

<d-expandable title="Apêndice de deploy">

> [!TIP]
> Mantenha o fluxo principal na seção principal e mova detalhes opcionais para cá.

```bash
npm install
npm run build
```

</d-expandable>
````

## Observações

- Use `open="true"` quando a seção precisar começar aberta.
- Mantenha os títulos principais fora do bloco expansível. Títulos dentro do corpo viram parágrafos comuns para manter o ToC estável.
- Evite aninhar um `<d-expandable>` dentro de outro nesta primeira versão.