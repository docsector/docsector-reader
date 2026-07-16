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
| `toolbar` | Força a barra de metadados a aparecer (`"true"`) ou sumir (`"false"`) |

## A Barra de Metadados

A barra de metadados é a faixa acima do código que leva o rótulo da linguagem e o botão de cópia.

Por padrão ela só aparece quando o bloco tem algo a oferecer — um snippet com várias linhas, abas ou um breadcrumb. Um bloco de **uma linha** é renderizado sem a barra, para que comandos curtos fiquem visualmente discretos no meio do texto.

Use `toolbar` quando esse padrão não servir para um bloco específico:

````markdown
```bash :toolbar="true";
curl -fsSL https://example.com/install | bash
```
````

O comando de instalação de uma linha é o caso clássico: é curto, mas é justamente a linha que todo leitor quer copiar.

O override funciona nos dois sentidos — `:toolbar="false";` tira a barra de um bloco que a ganharia por padrão, o que serve para saídas longas e árvores ASCII que ninguém copia:

````markdown
```text :toolbar="false";
project/
├── src/
└── README.md
```
````

Os números de linha não são afetados pelo `toolbar`; eles continuam seguindo a quantidade de linhas.

## O Que o Leitor Recebe

- Syntax highlighting por linguagem
- Números de linha em snippets com várias linhas
- Botão de cópia na barra de metadados, em todo bloco que a exibir
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
