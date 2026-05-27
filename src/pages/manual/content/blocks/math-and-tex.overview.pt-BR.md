## Visão Geral

O suporte a Math e TeX permite escrever equações inline e fórmulas destacadas diretamente no Markdown usando sintaxe compatível com KaTeX.

## Matemática Inline

Use delimitadores com um único cifrão dentro do texto normal:

```markdown
Use $E = mc^2$ dentro de uma frase.
```

## Matemática em Bloco

Use delimitadores com dois cifrões para fórmulas em destaque:

```markdown
$$
\int_0^1 x^2 dx
$$
```

## Observações

- Matemática funciona em parágrafos, hints e blocos expansíveis.
- Os delimitadores continuam literais dentro de código inline e blocos de código cercados.
- Use matemática em bloco quando a fórmula precisar de espaço visual próprio.