## Visão Geral

Blocos de código são escritos com cercas Markdown padrão e renderizados com syntax highlighting, números de linha, botão de cópia e metadados opcionais como nome de arquivo, abas e breadcrumbs.

O Docsector usa Prism.js para o highlighting e adapta automaticamente o visual aos modos claro e escuro.

## Sintaxe Básica

````markdown
```bash
npm install
npm run dev
```
````

## Linguagens Suportadas

A documentação padrão do projeto já vem com suporte para:

- `php`
- `bash`
- `html`
- `javascript`

Outras linguagens podem ser adicionadas quando o projeto precisar.

## Atributos Úteis

As fences de código aceitam metadados extras com a sintaxe `:attr;`:

| Atributo | Finalidade |
|----------|------------|
| `filename` | Mostra um nome de arquivo na barra de metadados |
| `group` | Junta blocos consecutivos em abas |
| `tab` | Define o rótulo visível da aba |
| `breadcrumb` | Mostra um caminho acima do bloco ativo |

## O Que o Leitor Recebe

- Syntax highlighting por linguagem
- Números de linha em snippets com várias linhas
- Botão de cópia na barra de metadados
- Abas para exemplos agrupados
- Breadcrumbs e ícones de arquivo quando há metadados

## Exemplo com Abas

````markdown
```php :group="example"; :tab="example.php"; :breadcrumb="src > example.php";
echo "Hello";
```
```bash :group="example"; :tab="example.sh"; :breadcrumb="scripts > example.sh";
echo "Hello"
```
````
