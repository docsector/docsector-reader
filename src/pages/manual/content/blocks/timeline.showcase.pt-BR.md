## Showcase

Os exemplos abaixo mostram timelines no estilo changelog com conteúdo rico, tags, datas repetidas e âncoras diretas.

### Conteúdo longo com múltiplas entradas

<d-block-timeline>
  <d-block-timeline-item date="2025-12-18">

<d-block-timeline-tag color="warning" icon="rocket_launch">release</d-block-timeline-tag>
<d-block-timeline-tag color="secondary" text-color="white">migração</d-block-timeline-tag>

## Preparação da migração

Comece documentando o escopo exato do rollout, incluindo as páginas, integrações e janelas de deploy afetadas pela mudança.

Crie uma checklist curta para o time e depois confirme quais partes do rollout podem acontecer em paralelo e quais precisam permanecer serializadas.

- Confirmar os ambientes afetados
- Registrar os passos de rollback
- Anotar qualquer comunicação ao usuário que precise sair junto com o release

~~~bash
npm run lint
npm run test
npm run build
~~~

  </d-block-timeline-item>

  <d-block-timeline-item date="2025-12-19">

<d-block-timeline-tag color="primary" text-color="white">operações</d-block-timeline-tag>
<d-block-timeline-tag color="orange" text-color="white">rollout</d-block-timeline-tag>

## Rollout incremental

Envie a primeira fatia para uma audiência menor, acompanhe o orçamento de erros e registre qualquer comportamento inesperado antes de ampliar a exposição.

Se as métricas continuarem saudáveis, avance para a segunda onda do rollout e atualize a entrada do changelog com o horário exato e o resultado observado.

> [!TIP]
> Datas e dots sticky ficam mais fáceis de validar quando cada item tem conteúdo suficiente para rolar de forma independente.

  </d-block-timeline-item>

  <d-block-timeline-item date="2025-12-20">

<d-block-timeline-tag color="teal" text-color="white">follow-up</d-block-timeline-tag>
<d-block-timeline-tag color="grey-8" text-color="white">docs</d-block-timeline-tag>

## Acompanhamento pós-release

Depois que o rollout terminar, colete as métricas finais, resuma o que mudou e adicione links para o artigo de suporte, notas de incidente ou guia de migração.

Esta entrada foi deixada propositalmente longa para ajudar a verificar o comportamento sticky do layout confortável também nos itens posteriores, não apenas no primeiro.

  </d-block-timeline-item>
</d-block-timeline>

### Entrada única longa

<d-block-timeline>
  <d-block-timeline-item date="2025-11-30">

<d-block-timeline-tag color="brown-5" text-color="white">único</d-block-timeline-tag>
<d-block-timeline-tag color="indigo" text-color="white" icon="push_pin">sticky-check</d-block-timeline-tag>

## Uma entrada longa para validar sticky

Use um timeline com item único quando quiser confirmar que a data e o dot continuam sticky corretamente mesmo sem outras entradas posteriores estendendo a trilha.

Repita conteúdo explicativo suficiente aqui para criar distância real de scroll dentro do item e confirmar que os metadados do lado esquerdo continuam visíveis enquanto o corpo se move.

Repita conteúdo explicativo suficiente aqui para criar distância real de scroll dentro do item e confirmar que os metadados do lado esquerdo continuam visíveis enquanto o corpo se move.

Repita conteúdo explicativo suficiente aqui para criar distância real de scroll dentro do item e confirmar que os metadados do lado esquerdo continuam visíveis enquanto o corpo se move.

  </d-block-timeline-item>
</d-block-timeline>

### Atualizações de produto

<d-block-timeline>
  <d-block-timeline-item date="2026-05-07">

<d-block-timeline-tag color="warning" icon="campaign">release</d-block-timeline-tag>
<d-block-timeline-tag color="amber-8" text-color="white">permissões</d-block-timeline-tag>

## Atualização nas permissões do site

Simplificamos a herança para que as permissões no nível do site fiquem mais fáceis de entender em conteúdos vinculados.

  </d-block-timeline-item>

  <d-block-timeline-item date="2026-04-28">

<d-block-timeline-tag color="positive" text-color="white">melhoria</d-block-timeline-tag>
<d-block-timeline-tag color="primary" text-color="white" icon="search">busca</d-block-timeline-tag>

## Busca do site mais rápida

Leitores agora recebem resultados mais rápidos a partir de um índice local, seguidos por refinamento remoto quando novas correspondências aparecem.

  </d-block-timeline-item>
</d-block-timeline>

### Markdown rico dentro das entradas

<d-block-timeline>
  <d-block-timeline-item date="2026-03-04">

<d-block-timeline-tag color="warning" icon="science">beta</d-block-timeline-tag>
<d-block-timeline-tag color="deep-orange" text-color="white">rss</d-block-timeline-tag>

## Blocos de update com suporte a RSS

> [!TIP]
> Use tags para marcar entradas beta ou específicas de rollout.

~~~bash
npm run build
npm run release
~~~

<d-block-quick-links title="Links relacionados">
  <d-block-quick-link title="Guia" description="Abra o guia de introdução" to="/guide/getting-started" />
  <d-block-quick-link title="Repositório" description="Veja o código-fonte" href="https://github.com/docsector/docsector-reader" icon="launch" />
</d-block-quick-links>

  </d-block-timeline-item>
</d-block-timeline>

### Âncoras explícitas

<d-block-timeline>
  <d-block-timeline-item date="2026-02-11" anchor="custom-icons-release">

<d-block-timeline-tag color="purple" text-color="white" icon="palette">ux</d-block-timeline-tag>

## Ícones customizados em hint blocks

Use o atributo `anchor` quando quiser um fragmento estável que não dependa do texto visível do título.

  </d-block-timeline-item>
</d-block-timeline>

### Datas repetidas com âncoras geradas únicas

<d-block-timeline>
  <d-block-timeline-item date="2026-01-05">

<d-block-timeline-tag color="positive" text-color="white">melhoria</d-block-timeline-tag>

## Melhorias de ano novo

Âncoras geradas continuam únicas mesmo quando outra entrada reutiliza a mesma data e o mesmo título.

  </d-block-timeline-item>

  <d-block-timeline-item date="2026-01-05">

<d-block-timeline-tag color="negative" text-color="white">correções</d-block-timeline-tag>

## Melhorias de ano novo

Esta segunda entrada recebe automaticamente um sufixo deduplicado no hash.

  </d-block-timeline-item>
</d-block-timeline>
