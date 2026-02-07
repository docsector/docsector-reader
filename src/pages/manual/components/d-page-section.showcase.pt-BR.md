## Demonstração

Aqui está o source Markdown que renderiza o conteúdo que você vê na aba Overview:

```
## Título da Seção

Texto de parágrafo com **negrito** e *itálico*.

- Item um
- Item dois
- Item três

| Coluna A | Coluna B |
|----------|----------|
| Célula 1 | Célula 2 |

### Sub-Seção

Mais conteúdo aqui.
```

Cada elemento se torna um token no tokenizador do DPageSection. Títulos criam âncoras na árvore de ToC à direita.

## Elementos Markdown Suportados

DPageSection renderiza os seguintes elementos Markdown:

- Títulos (H2 até H6)
- Parágrafos com formatação inline (negrito, itálico, links, código)
- Listas ordenadas e não ordenadas
- Tabelas com cabeçalhos
- Blocos de código cercados com syntax highlighting

## Bloco de Código com Nome de Arquivo

Use o atributo `:filename;` para exibir um cabeçalho com nome de arquivo:

```php
echo "Olá, Docsector!";
```

O nome do arquivo aparece na barra de info acima do bloco de código junto com o identificador de linguagem.
