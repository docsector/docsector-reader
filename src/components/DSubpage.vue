<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// components
import DPage from "./DPage.vue";
import DH1 from "./DH1.vue";
import DPageSection from "./DPageSection.vue";

const route = useRoute()

const id = computed(() => {
  const path = route.path

  let hash = 5381
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 33) ^ path.charCodeAt(i)
  }

  return hash >>> 0
})
</script>

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
