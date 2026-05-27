## Visão Geral

Seletor de Versão permite que o leitor navegue entre a documentação atual e versões arquivadas ou alternativas.

Ele ajuda a manter docs de longa duração utilizáveis quando o projeto suporta mais de uma linha de release.

## Como Funciona

- O seletor lê a lista de versões configuradas.
- A documentação atual normalmente fica em rotas sem prefixo.
- Versões arquivadas podem usar um prefixo como `/v0.x`.
- Quando possível, o seletor tenta abrir a página equivalente na versão de destino.
- Se a mesma página não existir lá, ele faz fallback para a primeira rota compatível naquele book.

## Badges de Release

O seletor pode mostrar badges como:

- `released`
- `draft`
- `deprecated`

Também é possível configurar labels e cores customizadas por versão.

## Observações

- Uma entrada de versão também pode apontar para uma URL externa.
- Mantenha os labels curtos para o dropdown continuar fácil de escanear.