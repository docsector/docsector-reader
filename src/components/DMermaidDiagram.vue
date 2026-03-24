<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

const $q = useQuasar()

let _counter = 0
const uid = `mermaid-${++_counter}-${Math.random().toString(36).slice(2, 7)}`

const svg = ref('')
const error = ref('')

async function render () {
  error.value = ''
  svg.value = ''

  try {
    const mermaid = (await import('mermaid')).default

    mermaid.initialize({
      startOnLoad: false,
      theme: $q.dark.isActive ? 'dark' : 'default'
    })

    const decoded = props.content
      .replace(/&#123;/g, '{')
      .replace(/&#125;/g, '}')
      .replace(/&amp;/g, '&')

    const { svg: rendered } = await mermaid.render(uid, decoded)
    svg.value = rendered
  } catch (e) {
    error.value = e?.message || 'Mermaid render error'
  }
}

onMounted(render)

watch(() => $q.dark.isActive, render)
</script>

<template>
  <div class="d-mermaid-diagram">
    <div
      v-if="svg"
      class="d-mermaid-diagram__svg"
      v-html="svg"
    />
    <div
      v-else-if="error"
      class="d-mermaid-diagram__error"
    >
      <pre>{{ error }}</pre>
      <pre class="d-mermaid-diagram__source">{{ content }}</pre>
    </div>
    <div
      v-else
      class="d-mermaid-diagram__loading"
    />
  </div>
</template>

<style lang="sass">
.d-mermaid-diagram
  margin: 1rem 0
  display: flex
  justify-content: center

  &__svg
    svg
      max-width: 100%
      height: auto

  &__error
    width: 100%
    padding: 0.75rem 1rem
    border-left: 3px solid #e53935
    background: rgba(229, 57, 53, 0.08)
    font-size: 0.85em
    pre
      margin: 0

  &__loading
    width: 100%
    min-height: 80px
    opacity: 0.3
    background: currentColor
    border-radius: 4px
    animation: mermaid-pulse 1.2s ease-in-out infinite

@keyframes mermaid-pulse
  0%, 100%
    opacity: 0.15
  50%
    opacity: 0.3
</style>
