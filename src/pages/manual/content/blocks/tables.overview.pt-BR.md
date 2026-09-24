## Visão Geral

Tabelas são úteis para comparações, matrizes de opções, notas de compatibilidade e qualquer conteúdo que se beneficie de um layout em linhas e colunas.

## Sintaxe em Markdown

```markdown
| Recurso | Status | Observações |
|---------|--------|-------------|
| Busca | Done | Disponível na sidebar |
| Math | Done | Renderizado com KaTeX |
| Mermaid | Done | Diagramas adaptados ao tema |
```

## Alinhamento

Dois-pontos na linha separadora alinham a coluna: `:---` à esquerda, `:---:` ao centro, `---:` à direita. Uma coluna sem dois-pontos mantém o alinhamento padrão, à esquerda.

```markdown
| Plano | Preço | Variação |
|:--------|------:|:--------:|
| Inicial | 1,200 | +9.9% |
```

## Tabelas Largas

Uma tabela mais larga que a página rola para o lado dentro da própria caixa, em vez de esticar a página — também dentro de um hint (`> [!NOTE]`) ou de um item de lista.

## Observações

- Mantenha os rótulos das colunas curtos e claros.
- Use tabelas quando a leitura em modo de varredura for mais importante que o fluxo narrativo.
- Se o conteúdo ficar denso demais, quebre em várias tabelas menores.
