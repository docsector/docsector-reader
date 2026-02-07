## Visão Geral

`QZoom` é um componente de **overlay de zoom** forked de `quasarframework/app-extension-qzoom` e portado de Vue 2 para Vue 3. Ele permite que qualquer conteúdo seja ampliado em um overlay fullscreen com escala opcional.

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `backgroundColor` | `String` | `'white'` | Cor de fundo do overlay |
| `restoreOnScroll` | `Boolean` | `false` | Fecha zoom quando o usuário faz scroll |
| `manual` | `Boolean` | `false` | Desabilita click-to-zoom automático |
| `scale` | `Boolean` | `false` | Habilita escala com roda do mouse |
| `initialScale` | `Number` | `1.0` | Escala inicial (0.05–10) |
| `scaleText` | `Boolean` | `false` | Habilita escala de font-size ao invés de transform |
| `initialScaleText` | `Number` | `100` | Porcentagem inicial de font-size (50–500) |
| `noCenter` | `Boolean` | `false` | Não centraliza conteúdo no overlay |
| `noWheelScale` | `Boolean` | `false` | Desabilita escala com roda do mouse |
| `noEscClose` | `Boolean` | `false` | Desabilita tecla Escape para fechar |

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `before-zoom` | — | Emitido antes da animação de zoom iniciar |
| `zoomed` | — | Emitido após a animação de zoom completar |
| `before-restore` | — | Emitido antes da animação de restaurar iniciar |
| `restored` | — | Emitido após a animação de restaurar completar |
| `scale` | `Number` | Emitido quando o valor de escala muda |
| `scale-text` | `Number` | Emitido quando o valor de escala de texto muda |

## Slot

O slot padrão recebe um Boolean `zoomed` indicando o estado de zoom atual:

```html
<q-zoom>
  <template v-slot:default="&#123; zoomed &#125;">
    <img src="diagrama.png" :class="zoomed ? 'zoomed' : ''" />
  </template>
</q-zoom>
```

## Como Funciona

1. Por padrão, clicar alterna entre normal e fullscreen
2. Um overlay é criado com transição suave (500ms zoom in, 400ms restore)
3. Durante o zoom, o scroll do body é desabilitado (a menos que `restoreOnScroll` seja true)
4. Pressione **Escape** para fechar (a menos que `noEscClose` seja true)

## Modos de Escala

Dois modos de escala mutuamente exclusivos:

- **Transform scale** (prop `scale`) — Escala todo o conteúdo usando CSS `transform: scale()`
- **Font-size scale** (prop `scaleText`) — Ajusta a porcentagem de `font-size` do conteúdo

Scroll com roda do mouse ajusta o valor de escala quando ampliado (a menos que `noWheelScale` seja true).

## Registro via Boot

QZoom é registrado globalmente via `src/boot/QZoom.js`:

```javascript
app.component('QZoom', QZoom)
```

Isso torna `<q-zoom>` disponível em todos os templates sem imports explícitos.

## Dependências

QZoom requer o pacote `q-colorize-mixin` para tratamento de cor de fundo, e `QZoom.styl` para seus estilos CSS.
