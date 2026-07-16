<template>
<q-layout view="lHh LpR lFf">
  <q-header class="d-header" :class="showSidebar ? 'left-btn' : 'd-header--no-sidebar'" elevated>
    <q-toolbar color="primary">
      <q-btn v-if="showSidebar" class="filled" square icon="menu" aria-label="Toggle Menu" @click="toogleMenu" />
      <q-toolbar-title
        class="d-header__brand-slot row no-wrap items-stretch self-stretch q-pa-none"
        :class="$q.screen.lt.sm ? 'justify-start' : 'justify-center'"
      >
        <q-btn
          class="filled d-header__brand"
          :class="$q.screen.lt.sm ? 'q-px-sm' : 'q-px-md'"
          align="left"
          no-caps
          stretch
          to="/"
          :aria-label="brandAriaLabel"
        >
          <img
            v-if="branding.logo"
            :src="branding.logo"
            :alt="brandName"
            height="26"
            class="d-header__brand-logo q-mr-sm"
          />
          <span class="d-header__brand-text col column justify-center no-wrap">
            <span class="d-header__brand-name ellipsis text-left">{{ brandLockup }}</span>
            <span
              v-if="brandVersion"
              class="d-header__brand-version text-caption ellipsis text-left"
            >{{ brandVersion }}</span>
          </span>
        </q-btn>
      </q-toolbar-title>
      <q-btn
        v-if="assistantEnabled"
        class="filled d-header__assistant-toggle"
        :class="assistantOpen ? 'active' : null"
        square
        icon="auto_awesome"
        :aria-label="t('assistant.open')"
        @click="toggleAssistant"
      >
        <q-tooltip>{{ t('assistant.open') }}</q-tooltip>
      </q-btn>
      <q-btn class="filled" square icon="settings" aria-label="Configuration" @click="openSettingsDialog" />
    </q-toolbar>

    <q-separator v-if="sortedBooks.length > 0" class="d-book-tabs-separator" dark />

    <q-tabs
      v-if="sortedBooks.length > 0"
      :model-value="activeBookTab"
      dense
      align="left"
      narrow-indicator
      class="bg-primary d-book-tabs"
      @update:model-value="onBookTabChange"
    >
      <q-tab
        v-for="book in sortedBooks"
        :key="book.id"
        :name="book.id"
        :label="book.label"
        :icon="book.icon"
        class="d-book-tab"
        :style="getBookTabStyle(book)"
        no-caps
      />
    </q-tabs>
  </q-header>

  <q-drawer v-if="showSidebar" elevated show-if-above side="left" v-model="layout.menu">
    <d-menu />
  </q-drawer>

  <router-view />

  <d-footer-host />
</q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMeta, colors, useQuasar } from 'quasar'

import DMenu from '../components/DMenu.vue'
import DFooterHost from '../components/DFooterHost.vue'
import docsectorConfig from 'docsector.config.js'
import { normalizeAiAssistantConfig } from '../ai-assistant/config'
import { allBooks, booksByVersion } from 'virtual:docsector-books'
import { resolveRoutePageLayout } from '../page-layout'

defineOptions({ name: 'LayoutDefault' })

const branding = docsectorConfig.branding || {}
const brandName = branding.name || 'Docsector'
const brandVersion = typeof branding.version === 'string' ? branding.version.trim() : ''
const brandAriaLabel = `Open ${brandName} home`
const assistantConfig = normalizeAiAssistantConfig(docsectorConfig)
const assistantEnabled = assistantConfig.enabled === true

const route = useRoute()
const router = useRouter()
const store = useStore()
const $q = useQuasar()
const { t, locale } = useI18n()

// Localized brand lockup — each locale owns the word order around {name}
const brandLockup = computed(() => t('system.brand', { name: brandName }))

const layout = ref({
  menu: false
})

const pageLayout = computed(() => resolveRoutePageLayout(route))
const showSidebar = computed(() => pageLayout.value.sidebar)
const assistantOpen = computed(() => store.state.layout.assistant)

watch(showSidebar, (value) => {
  if (!value) {
    layout.value.menu = false
  }
}, { immediate: true })

const defaultBookTabColors = Object.freeze({
  active: 'white',
  inactive: 'rgba(255, 255, 255, 0.72)'
})

const quasarBrandColorPattern = /^(primary|secondary|accent|dark|positive|negative|info|warning)$/
const quasarUtilityColorPattern = /^(white|black|transparent|separator|dark-separator)$/
const quasarPaletteColorPattern = /^(red|pink|purple|deep-purple|indigo|blue|light-blue|cyan|teal|green|light-green|lime|yellow|amber|orange|deep-orange|brown|grey|blue-grey)(-(?:[1-9]|1[0-4]))?$/

const isQuasarColorToken = (token) => {
  return quasarBrandColorPattern.test(token)
    || quasarUtilityColorPattern.test(token)
    || quasarPaletteColorPattern.test(token)
}

const normalizeBookTabColors = (book) => {
  const color = book?.color

  if (typeof color === 'object' && color !== null && !Array.isArray(color)) {
    const active = typeof color.active === 'string' && color.active.trim().length > 0
      ? color.active.trim()
      : defaultBookTabColors.active

    const inactive = typeof color.inactive === 'string' && color.inactive.trim().length > 0
      ? color.inactive.trim()
      : active

    return { active, inactive }
  }

  if (typeof color === 'string' && color.trim().length > 0) {
    const normalized = color.trim()
    return {
      active: normalized,
      inactive: normalized
    }
  }

  return { ...defaultBookTabColors }
}

const resolveBookTabColor = (token) => {
  const normalized = String(token || '').trim()
  if (normalized.length === 0) {
    return ''
  }

  if (normalized.startsWith('var(')) {
    return normalized
  }

  if (normalized.startsWith('--')) {
    return `var(${normalized})`
  }

  if (/^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(normalized)) {
    return normalized
  }

  if (['inherit', 'currentColor', 'transparent', 'initial', 'unset', 'revert', 'revert-layer'].includes(normalized)) {
    return normalized
  }

  if (isQuasarColorToken(normalized)) {
    if (typeof document === 'undefined') {
      return quasarBrandColorPattern.test(normalized)
        ? `var(--q-${normalized})`
        : normalized
    }

    try {
      return colors.getPaletteColor(normalized)
    } catch {
      return normalized
    }
  }

  return normalized
}

const getBookTabStyle = (book) => {
  const colors = normalizeBookTabColors(book)
  const active = resolveBookTabColor(colors.active) || resolveBookTabColor(defaultBookTabColors.active)
  const inactive = resolveBookTabColor(colors.inactive) || resolveBookTabColor(defaultBookTabColors.inactive)

  return {
    '--d-book-tab-active-color': active,
    '--d-book-tab-inactive-color': inactive
  }
}

const activeVersionId = computed(() => {
  return route.matched?.[0]?.meta?.version ?? route.meta?.version ?? null
})

const activeVersionBooks = computed(() => {
  if (activeVersionId.value && booksByVersion?.[activeVersionId.value]?.allBooks) {
    return booksByVersion[activeVersionId.value].allBooks
  }

  return allBooks || []
})

const sortedBooks = computed(() => {
  return [...activeVersionBooks.value]
    .filter(book => book && typeof book.id === 'string' && book.id.length > 0)
    .sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
      const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })
})

const activeBookTab = computed(() => {
  const routeBook = route.matched?.[0]?.meta?.book ?? route.meta?.book ?? null
  if (!routeBook || routeBook === 'home') return null

  const exists = sortedBooks.value.some(book => book.id === routeBook)
  return exists ? routeBook : null
})

const resolveLocalizedValue = (source) => {
  if (!source) return ''
  if (typeof source === 'string') return source
  if (typeof source === 'object') {
    return source[locale.value] || source['*'] || source['en-US'] || Object.values(source)[0] || ''
  }
  return ''
}

// @ Dynamic page title & meta tags
const pageTitle = computed(() => {
  const data = route.matched[0]?.meta?.data
  const langData = data?.[locale.value] || data?.['*'] || data?.['en-US'] || Object.values(data || {})[0]
  return langData?.title || ''
})

const pageDescription = computed(() => {
  const description = resolveLocalizedValue(route.matched[0]?.meta?.meta?.description)
  if (description) return description

  if (pageTitle.value && branding.name) {
    return `${pageTitle.value} — Documentation of ${branding.name}`
  }

  if (branding.name) {
    return `Documentation of ${branding.name}`
  }

  return ''
})

useMeta(() => {
  const title = pageTitle.value
    ? `${pageTitle.value} — ${branding.name || ''}`
    : branding.name || ''

  const description = pageDescription.value
  const image = branding.logo || ''

  return {
    title,
    meta: {
      description: { name: 'description', content: description },
      ogTitle: { property: 'og:title', content: title },
      ogDescription: { property: 'og:description', content: description },
      ogType: { property: 'og:type', content: 'article' },
      ogImage: { property: 'og:image', content: image },
      twitterCard: { name: 'twitter:card', content: 'summary_large_image' },
      twitterTitle: { name: 'twitter:title', content: title },
      twitterDescription: { name: 'twitter:description', content: description },
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

function toggleAssistant () {
  store.commit('layout/setAssistant', !store.state.layout.assistant)
}

function getFirstRoutePathByBook (bookId) {
  const routes = router.options?.routes || []
  const versionId = activeVersionId.value
  let fallbackPath = null

  for (const topRoute of routes) {
    if (!topRoute || typeof topRoute.path !== 'string') continue
    if (versionId && topRoute.meta?.version !== versionId) continue
    if ((topRoute.meta?.book ?? topRoute.meta?.type) !== bookId) continue

    const children = Array.isArray(topRoute.children) ? topRoute.children : []
    const hasOverview = children.some(child => child.path === 'overview')
    if (!hasOverview) continue

    const candidatePath = `${topRoute.path.replace(/\/$/, '')}/overview/`
    if (fallbackPath === null) {
      fallbackPath = candidatePath
    }

    const hasInternalLink = typeof topRoute.meta?.link?.to === 'string' && topRoute.meta.link.to.trim().length > 0
    if (hasInternalLink) {
      continue
    }

    return candidatePath
  }

  return fallbackPath || '/'
}

function onBookTabChange (bookId) {
  if (!bookId) return

  const targetPath = getFirstRoutePathByBook(bookId)
  if (route.path !== targetPath) {
    router.push(targetPath)
  }
}

const normalizeRoutePath = (path) => {
  const normalized = String(path || '').trim()
  if (normalized === '' || normalized === '/') {
    return '/'
  }

  const sanitized = normalized.replace(/\/+$/, '')
  return sanitized === '' ? '/' : sanitized
}

const isSameEffectivePage = (from, to) => {
  return normalizeRoutePath(from?.path) === normalizeRoutePath(to?.path)
}

// --- created logic (runs at setup time) ---
store.dispatch('app/configureLanguage', route.matched)

router.afterEach((to, from) => {
  if (!isSameEffectivePage(from, to)) {
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
  .d-header__brand
    min-width: 0
    max-width: 100%
  .d-header__brand-logo
    display: block
    flex-shrink: 0
  .d-header__brand-text
    min-width: 0
    line-height: 1
  .d-header__brand-name
    display: block
    line-height: 0.95rem
  .d-header__brand-version
    display: block
    margin-top: -2px
    font-size: 10px
    line-height: 0.75rem
    opacity: 0.8
  .q-tabs
    margin-top: 2px
  .d-book-tabs-separator
    opacity: 0.25
  .d-book-tabs
    .q-tab__indicator
      background-color: currentColor
  .d-book-tab
    color: var(--d-book-tab-inactive-color, rgba(255, 255, 255, 0.72))
    opacity: 0.5
    font-weight: 400
    transition: color 0.2s ease, opacity 0.2s ease
    &:hover
      opacity: 0.8
  .d-book-tab.q-tab--active
    color: var(--d-book-tab-active-color, #ffffff)
    opacity: 1
    font-weight: 600
  .q-btn
    border-radius: 0
  .d-header__assistant-toggle.active
    background: rgba(255, 255, 255, 0.16)
  .q-btn:before
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2), 0 0 2px rgba(0, 0, 0, 0.14), 0 0 1px -2px rgba(0, 0, 0, 0.12)
    border-radius: 0
</style>
