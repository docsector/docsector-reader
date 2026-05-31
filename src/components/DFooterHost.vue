<template>
  <teleport v-if="ready && siteFooterOutletElement" :to="siteFooterOutletElement">
    <d-footer />
  </teleport>

  <d-footer v-else-if="ready" />
</template>

<script setup>
import { onMounted, ref } from 'vue'

import DFooter from './DFooter.vue'
import { siteFooterOutletElement } from '../composables/site-footer-outlet'

defineOptions({ name: 'DFooterHost' })

const ready = ref(false)

onMounted(() => {
  ready.value = true
})
</script>