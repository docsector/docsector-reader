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
    <!-- Remote README homepages can't carry :toolbar= fence attributes (the file
         renders on GitHub too), and their one-liners are usually copyable
         commands — so the meta row defaults ON there -->
    <!-- Every page mounts progressively: the first blocks render synchronously
         and the below-the-fold rest appends in idle batches, so the initial
         render task (and Total Blocking Time) stays small on long pages -->
    <d-page-section
      :id="id"
      :render-primary-heading="usesRemoteReadmeHome"
      :code-toolbar-default="usesRemoteReadmeHome ? true : null"
      progressive
      :template="template"
    />
  </main>
</d-page>
</template>
