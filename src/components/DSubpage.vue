<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { homePageSourceMode } from 'virtual:docsector-homepage-override'
// components
import DPage from "./DPage.vue";
import DPageBar from "./DPageBar.vue";
import DH1 from "./DH1.vue";
import DPageSection from "./DPageSection.vue";
import { usesRemoteReadmeHomeContent } from '../home-page-mode'
import { getTemplate } from '../page-template'

const route = useRoute()
const store = useStore()

const template = computed(() => {
  const relative = store.state.page.relative
  const subpage = relative ? relative.replace(/^\//, '') : 'overview'
  const templates = route.matched?.[0]?.meta?.subpageTemplates
  return getTemplate(templates?.[subpage])
})

const id = computed(() => {
  const path = route.path

  let hash = 5381
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 33) ^ path.charCodeAt(i)
  }

  return hash >>> 0
})

const usesRemoteReadmeHome = computed(() => {
  return usesRemoteReadmeHomeContent({
    pageBase: store.state.page.base,
    homePageSourceMode
  })
})
</script>

<template>
<d-page show-back-to-top-control>
  <header>
    <d-page-bar />
    <hr />
    <d-h1 v-if="!usesRemoteReadmeHome" :id="0" />
    <span v-else id="0" aria-hidden="true"></span>
  </header>

  <main>
    <d-page-section :id="id" :render-primary-heading="usesRemoteReadmeHome" :template="template" />
  </main>
</d-page>
</template>
