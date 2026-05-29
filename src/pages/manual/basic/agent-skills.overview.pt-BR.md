## Visão Geral

O Docsector Reader publica uma skill de autoria para agentes de IA que precisam entender como a documentação Docsector funciona.

A skill é um arquivo `SKILL.md` com referências complementares. Ela explica as convenções de Markdown do Docsector, todos os blocos documentados, estrutura de páginas, caminhos de assets, padrões de autoria, busca via MCP e ferramentas WebMCP no navegador.

## URLs Públicas

A skill embutida é publicada como artefato estático:

```text
/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md
```

O índice de descoberta aponta os agentes para o mesmo arquivo e inclui um digest SHA-256:

```text
/.well-known/agent-skills/index.json
```

## O Que a Skill Contém

<d-block-quick-links title="Referências da skill">
  <d-block-quick-link
    title="SKILL.md"
    description="O fluxo compacto que os agentes carregam primeiro"
    href="/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md"
  />
  <d-block-quick-link
    title="Catálogo de blocos"
    description="Todos os blocos Docsector, sintaxe e orientação de uso"
    href="/.well-known/agent-skills/docsector-documentation-authoring/references/block-catalog.md"
  />
  <d-block-quick-link
    title="Estrutura de páginas"
    description="Arquivos de página, locales, assets, exemplos e convenções de API JSON"
    href="/.well-known/agent-skills/docsector-documentation-authoring/references/page-structure.md"
  />
  <d-block-quick-link
    title="MCP e WebMCP"
    description="Como agentes podem buscar, ler, navegar e copiar docs ao vivo"
    href="/.well-known/agent-skills/docsector-documentation-authoring/references/mcp-webmcp.md"
  />
</d-block-quick-links>

## Cópias Local e Publicada

O Docsector mantém duas cópias sincronizadas da mesma skill:

- `.github/skills/docsector-documentation-authoring/` para assistentes locais do repositório, como o GitHub Copilot no VS Code.
- `public/.well-known/agent-skills/docsector-documentation-authoring/` para o site de documentação gerado.

Durante o build, o Docsector copia o artefato público para `dist/spa/.well-known/agent-skills/` e gera o índice de descoberta.

## Como Agentes Devem Usar

Agentes devem carregar primeiro o `SKILL.md` e abrir os arquivos de referência apenas quando a tarefa precisar de mais detalhes.

Para exemplos atuais de páginas, agentes podem combinar a skill com as ferramentas MCP do Docsector:

```text
search_docsector
get_page_docsector
```

Agentes no navegador também podem usar ferramentas WebMCP quando `navigator.modelContext` estiver disponível:

- `docs.search_docs`
- `docs.get_page`
- `docs.navigate_to`
- `docs.copy_current_page`

## Quando Publicar Sua Própria Skill

Publique uma skill específica do projeto quando sua documentação tiver regras de domínio que não são cobertas pela skill de autoria embutida do Docsector.

Use a configuração `agentSkills` do Docsector para expor a skill por `/.well-known/agent-skills/index.json`, e mantenha o artefato em `public/.well-known/agent-skills/...` quando quiser que o Docsector calcule o digest automaticamente.
