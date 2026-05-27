## Visão Geral

Editar no GitHub dá ao leitor um caminho direto da página atual até o arquivo Markdown de origem.

Isso acelera pequenas melhorias na documentação, especialmente quando o leitor já está na página que precisa de ajuste.

## O Que Ele Usa

O link é montado a partir de:

- `github.editBaseUrl` em `docsector.config.js`
- O caminho da página atual
- O locale atual

## Labels Sensíveis ao Status

O label do botão se adapta ao status da página:

- `done` ou `new` → editar a página
- `draft` → completar a página
- `empty` → começar a página

## Observações

- O arquivo de destino segue a convenção de nomes baseada em book, path, subpage e locale.
- Essa ação aparece na área de rodapé da página.