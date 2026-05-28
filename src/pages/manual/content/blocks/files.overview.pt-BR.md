## Visão Geral

Arquivos renderizam um card de download diretamente no Markdown para que uma page ou subpage publique anexos sem sair do fluxo normal de autoria.

Eles são úteis para checklists, bundles de exemplo, PDFs, notas de release e qualquer outro arquivo que precise ficar no fluxo de leitura.

## Sintaxe em Markdown

```html
<d-block-file src="/files/manual/release-checklist.txt" title="Checklist de release" size="1 KB">
Baixe o anexo de exemplo usado neste manual.
</d-block-file>
```

Você também pode omitir o corpo da legenda quando o nome do arquivo já fornece contexto suficiente:

```html
<d-block-file src="/files/manual/release-checklist.txt" size="1 KB" />
```

## Observações

- Guarde anexos pequenos versionados no repositório em `public/files/` e prefira caminhos absolutos como `/files/...`.
- `src` é obrigatório. `title` e `size` são opcionais.
- Quando `title` não é informado, o card renderizado usa o nome do arquivo presente em `src`.
- O corpo do bloco é renderizado como legenda com Markdown inline.
- URLs externas também funcionam, então a mesma sintaxe pode apontar no futuro para um bucket R2 ou outro CDN.