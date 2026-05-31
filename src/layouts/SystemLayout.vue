<template>
  <q-layout view="lHh lpR lFr">
    <router-view />
    <d-footer-host />
  </q-layout>
</template>

<script setup>
import DFooterHost from '../components/DFooterHost.vue'

defineOptions({ name: 'LayoutSystem' })
</script>
