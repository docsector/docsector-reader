## Visão Geral

Títulos organizam o fluxo da leitura e alimentam o índice lateral da página.

No Docsector, cada heading escrito no corpo do Markdown vira uma âncora navegável automaticamente usando slug compatível com GitHub, mantendo hash da URL e ToC sincronizados.

## Níveis de Markdown

| Markdown | HTML | Uso típico |
|----------|------|------------|
| `#` | `<h1>` | Título da página gerado a partir dos metadados |
| `##` | `<h2>` | Seções principais |
| `###` | `<h3>` | Sub-seções |
| `####` | `<h4>` | Seções de detalhe |
| `#####` | `<h5>` | Divisões menores |
| `######` | `<h6>` | Divisões bem pequenas |

## Notas de Autoria

- No conteúdo da página, o primeiro heading costuma ser `##`, porque o título principal já é resolvido automaticamente.
- Sempre que possível, mantenha a hierarquia em ordem. Pular níveis deixa o ToC mais difícil de ler.
- Use títulos para quebrar páginas longas em partes que possam ser linkadas, revisitadas e referenciadas por um Table of Contents padrão de Markdown.

## O Que o Docsector Faz

- Registra os headings como âncoras no ToC da página
- Usa slugs compatíveis com GitHub nos hashes dos headings
- Mantém os hashes de navegação alinhados ao heading selecionado
- Monta a árvore de seções automaticamente a partir da estrutura do Markdown

## Exemplo em Markdown

```markdown
## Instalação

Introdução curta.

### Variáveis de ambiente

Detalhes extras de setup.

#### Flags opcionais

Notas para leitores avançados.
```
