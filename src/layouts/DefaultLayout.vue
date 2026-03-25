<template>
<q-layout view="lHh LpR lFf">
  <q-header class="d-header left-btn" elevated>
    <q-toolbar color="primary">
      <q-btn class="filled" square icon="menu" aria-label="Toggle Menu" @click="toogleMenu" />
      <q-toolbar-title class="text-center">
        <img
          v-if="branding.logo"
          :src="branding.logo"
          :alt="branding.name"
          height="26"
          style="vertical-align: middle;"
          class="q-mr-sm"
        />
        <q-icon class="q-mb-xs q-mr-sm" :name="headerTitleIcon" />
        {{ headerTitleText }}
      </q-toolbar-title>
      <q-btn class="filled" square icon="settings" aria-label="Configuration" @click="openSettingsDialog" />
    </q-toolbar>
  </q-header>

  <q-drawer elevated show-if-above side="left" v-model="layout.menu">
    <d-menu />
  </q-drawer>

  <router-view />
</q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMeta } from 'quasar'

import DMenu from '../components/DMenu.vue'
import docsectorConfig from 'docsector.config.js'

defineOptions({ name: 'LayoutDefault' })

const branding = docsectorConfig.branding || {}

const route = useRoute()
const router = useRouter()
const store = useStore()
const { t, locale } = useI18n()

const layout = ref({
  menu: false
})

const headerTitleIcon = computed(() => {
  return route.matched[0].meta.icon ?? route.meta.icon
})

const headerTitleText = computed(() => {
  if (store.state.i18n.base) {
    return t(`_.${store.state.i18n.base}._`)
  } else {
    return t(`menu.${route.matched[1].meta.menu}`)
  }
})

// @ Dynamic page title & meta tags
const pageTitle = computed(() => {
  const data = route.matched[0]?.meta?.data
  if (data) {
    const langData = data[locale.value] || data['en-US'] || Object.values(data)[0]
    return langData?.title || ''
  }
  return ''
})

useMeta(() => {
  const title = pageTitle.value
    ? `${pageTitle.value} — ${branding.name || ''}`
    : branding.name || ''

  const image = branding.logo || ''

  return {
    title,
    meta: {
      ogTitle: { property: 'og:title', content: title },
      ogType: { property: 'og:type', content: 'article' },
      ogImage: { property: 'og:image', content: image },
      twitterImage: { name: 'twitter:image', content: image }
    }
  }
})

function toogleMenu () {
  layout.value.menu = !layout.value.menu
}

function openSettingsDialog () {
  store.commit('settings/dialog', true)
}

// --- created logic (runs at setup time) ---
store.dispatch('app/configureLanguage', route.matched)

router.afterEach((to, from) => {
  if (!to.hash || (from.path !== to.path)) {
    store.dispatch('app/configureLanguage', to.matched)
  }
})

store.commit('page/resetAnchors')
</script>

<style lang="sass">
// Header
.d-header
  &.left-btn
    .q-toolbar
      padding: 0
  .q-btn
    border-radius: 0
  .q-btn:before
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2), 0 0 2px rgba(0, 0, 0, 0.14), 0 0 1px -2px rgba(0, 0, 0, 0.12)
    border-radius: 0
</style>
