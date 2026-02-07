## Demonstração

Veja como DPage é usado dentro do DSubpage:

```html
<template>
  <d-page>
    <header>
      <d-h1 :id="0" />
    </header>
    <main>
      <d-page-section :id="id" />
    </main>
  </d-page>
</template>
```

A barra de submenu se adapta automaticamente à configuração da página. Se apenas Overview estiver configurado, a barra mostra uma única aba. Quando as abas Showcase ou Vs estão habilitadas, a barra expande com botões rotulados.

## Comportamento Mobile

Em dispositivos móveis (`$q.screen.lt.md`), os labels dos botões do submenu ficam ocultos, mostrando apenas ícones. O drawer de âncoras à direita se torna um overlay que pode ser alternado com o botão de ícone de árvore.

## Exemplo de Conteúdo Customizado

Você também pode usar DPage com `disableNav` para criar páginas standalone sem navegação inferior:

```html
<d-page :disable-nav="true">
  <div class="text-center q-pa-lg">
    <h2>Conteúdo Customizado</h2>
    <p>Sem nav inferior, sem links prev/next.</p>
  </div>
</d-page>
```
