## Visão Geral

Busca ajuda o leitor a encontrar páginas da documentação rapidamente pela barra lateral esquerda.

Na implementação, essa experiência é sustentada pelo fluxo de busca usado em `DMenu`.

## O Que a Busca Considera

- Títulos de página e labels localizados
- `metadata.tags` definidos em `src/pages/*.index.js`
- Conteúdo Markdown das páginas overview, showcase e vs

## Comportamento

- A busca começa quando a consulta tem mais de um caractere.
- Os resultados seguem a versão ativa da documentação e o book atual.
- O locale atual tem prioridade, com fallback para `en-US` quando necessário.
- O input usa debounce para que a digitação rápida não reconstrua os resultados a cada tecla.

## Boas Práticas

- Mantenha títulos de página descritivos.
- Adicione tags de busca úteis perto da entrada da página no registry.
- Prefira termos curtos e concretos para o leitor adivinhar a palavra certa com facilidade.