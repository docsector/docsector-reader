<script setup>
// defineProps is a compiler macro in <script setup>, no import needed

const props = defineProps({
  message: {
    type: String,
    default: ''
  }
})
</script>

<template>
<blockquote>
  <strong v-if="message === 'important'">Important</strong>
  <strong v-else-if="message === 'warning'">Warning</strong>
  <strong v-else-if="message === 'note'">Note</strong>
  <slot />
</blockquote>
</template>
