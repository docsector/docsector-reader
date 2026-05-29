## Visão geral

Os blocos Timeline renderizam atualizações cronológicas dentro do Markdown, sendo uma boa escolha para changelogs, notas de versão, históricos de migração e diários de rollout.

Cada item exige uma data, pode expor tags opcionais, aceita uma âncora estável e renderiza conteúdo rico dentro da entrada.

O bloco é escrito com os elementos Markdown customizados `<d-block-timeline>`, `<d-block-timeline-item>` e os filhos opcionais `<d-block-timeline-tag>`.

## Exemplo em HTML

````html
<d-block-timeline>
  <d-block-timeline-item date="2025-12-25" anchor="brand-new-update">

<d-block-timeline-tag color="warning" icon="rocket_launch">beta</d-block-timeline-tag>
<d-block-timeline-tag color="secondary" text-color="white">docs</d-block-timeline-tag>

## Uma atualização novinha

Use este bloco para notas de versão, anúncios de produto, avisos de migração ou atualizações operacionais.

<d-block-quick-links title="Links relacionados">
  <d-block-quick-link title="Instalar" description="Prepare o projeto" to="/guide/getting-started" />
</d-block-quick-links>

  </d-block-timeline-item>

  <d-block-timeline-item date="2026-01-10">

## Disponibilidade geral

Esta segunda entrada recebe sua própria âncora gerada automaticamente, mesmo quando datas se repetem.

  </d-block-timeline-item>
</d-block-timeline>
````

## Observações

- Todo `<d-block-timeline-item>` precisa definir o atributo `date`.
- As tags do timeline são opcionais e devem ser declaradas com `<d-block-timeline-tag>` dentro do corpo do item.
- `<d-block-timeline-tag>` aceita texto simples ou um atributo `label`, além de `color`, `text-color` e `icon` opcionais.
- `anchor` é opcional. Quando omitido, o Docsector gera um hash único a partir da data do item e do primeiro bloco de texto visível dentro da entrada.
- O corpo do item suporta Markdown comum, alertas, blocos de código, matemática, tabelas, imagens e blocos Docsector aninhados que já funcionam em seções normais da página.
- Títulos dentro dos itens são achatados para saída de parágrafo, para manter estável o sumário principal da página.
- Itens de Timeline não adicionam novos nós ao sumário lateral; links profundos continuam funcionando com hashes normais.
- Mantenha um título ou parágrafo inicial claro no topo de cada item para que as âncoras geradas fiquem legíveis.