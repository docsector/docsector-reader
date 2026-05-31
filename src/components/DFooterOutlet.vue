<template>
  <div ref="outlet" class="d-footer-outlet"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

import { registerSiteFooterOutlet, unregisterSiteFooterOutlet } from '../composables/site-footer-outlet'

defineOptions({ name: 'DFooterOutlet' })

const outlet = ref(null)

onMounted(() => {
  registerSiteFooterOutlet(outlet.value)
})

onBeforeUnmount(() => {
  unregisterSiteFooterOutlet(outlet.value)
})
</script>

<style lang="sass">
.d-footer-outlet
  width: calc(100% + (2 * var(--d-footer-outlet-padding-x, 0px)))
  margin-left: calc(-1 * var(--d-footer-outlet-padding-x, 0px))
  margin-right: calc(-1 * var(--d-footer-outlet-padding-x, 0px))
  margin-bottom: calc(-1 * var(--d-footer-outlet-padding-bottom, 0px))

  > .d-footer
    box-sizing: border-box
    padding-bottom: var(--d-footer-outlet-padding-bottom, 0px)
</style>