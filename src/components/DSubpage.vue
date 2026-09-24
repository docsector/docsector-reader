<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { homePageSourceMode } from 'virtual:docsector-homepage-override'
import docsectorConfig from 'docsector.config.js'
// components
import DPage from "./DPage.vue";
import DPageBar from "./DPageBar.vue";
import DH1 from "./DH1.vue";
import DPageSection from "./DPageSection.vue";
import DPageAd from './DPageAd.vue'
import { normalizeAdsConfig, resolvePageAd } from '../ads/config'
import { usesRemoteReadmeHomeContent } from '../home-page-mode'
import { hashString } from '../hash'
import { getTemplate } from '../page-template'

const route = useRoute()
const store = useStore()

const template = computed(() => {
  const relative = store.state.page.relative
  const subpage = relative ? relative.replace(/^\//, '') : 'overview'
  const templates = route.matched?.[0]?.meta?.subpageTemplates
  return getTemplate(templates?.[subpage])
})

// ? raw route.path on purpose — the id seeds code-line anchors that shared
//   links already point to
const id = computed(() => hashString(route.path))

// ? static config and a normalized path — the server and the client pick the
//   same creative for /x/overview and /x/overview/
const ads = normalizeAdsConfig(docsectorConfig)
const ad = computed(() => resolvePageAd(ads, route))

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

  <d-page-ad v-if="ad" :ad="ad" />

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
