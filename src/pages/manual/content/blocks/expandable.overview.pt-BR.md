## Visão Geral

Blocos expansíveis recolhem conteúdo secundário atrás de um título clicável.

Eles funcionam bem quando a seção principal precisa continuar curta, mas o leitor ainda pode precisar de detalhes opcionais, checklists, apêndices ou exemplos mais longos.

O bloco é escrito com o custom element Markdown `<d-block-expandable>`.

## Exemplo em HTML

O custom element pode ser escrito diretamente no Markdown da página:

````html
<d-block-expandable title="Por que esconder este conteúdo?">

Use blocos expansíveis quando a seção principal deve continuar concisa, mas o leitor ainda pode precisar de mais detalhes.

</d-block-expandable>

### Aberto por Padrão

<d-block-expandable title="Checklist de release" open="true">

- Revisar breaking changes
- Atualizar screenshots
- Rodar smoke tests

</d-block-expandable>

### Conteúdo Rico

<d-block-expandable title="Apêndice de deploy">

> [!TIP]
> Mantenha o fluxo principal na seção principal e mova detalhes opcionais para cá.

```bash
npm install
npm run build
```

</d-block-expandable>
````

## Observações

- Use `open="true"` quando a seção precisar começar aberta.
- Mantenha os títulos principais fora do bloco expansível. Títulos dentro do corpo viram parágrafos comuns para manter o ToC estável.
- Evite aninhar um `<d-block-expandable>` dentro de outro nesta primeira versão.