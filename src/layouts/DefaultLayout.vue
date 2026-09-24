<template>
<q-layout view="lHh LpR lFf">
  <!-- ? height-hint: the real header height (toolbar 52 + separator 1 + book
       tabs 56 — viewport-independent), so the SSR-rendered page-container
       padding matches what QLayout measures after hydration. Without it the
       server assumes 50px and the whole page shifts down on mount (CLS). -->
  <q-header
    class="d-header"
    :class="showSidebar ? 'left-btn' : 'd-header--no-sidebar'"
    :height-hint="sortedBooks.length > 0 ? 111 : 53"
    elevated
  >
    <q-toolbar color="primary">
      <q-btn v-if="showSidebar" class="filled" square icon="menu" aria-label="Toggle Menu" @click="toogleMenu" />
      <!-- ? Viewport-dependent alignment/padding live in CSS media queries
           (see the style block): class bindings from $q.screen serialize the
           wrong breakpoint on SSR and shift the brand when Screen measures -->
      <q-toolbar-title
        class="d-header__brand-slot row no-wrap items-stretch self-stretch q-pa-none"
        :class="headerFit"
      >
        <!-- ? with header links the brand is a split button: the brand goes
             home, the arrow opens the links whenever the centered nav does
             not fit (a container query, CSS) -->
        <div v-if="headerEntries.length > 0" class="d-header__bar">
          <q-btn-dropdown
            class="d-header__brand"
            split
            align="left"
            no-caps
            stretch
            to="/"
            menu-anchor="bottom start"
            menu-self="top start"
            content-class="d-header-links__menu"
            :toggle-aria-label="t('header.links')"
          >
            <template #label>
              <d-header-brand />
            </template>
            <!-- ? data-autofocus: QMenu focuses the first row on open; the
                 arrow keys then move between rows -->
            <q-list role="none" data-autofocus @keydown="move">
              <template v-for="(link, index) in headerLinks" :key="index">
                <div v-if="link.children.length > 0" role="group" :aria-label="link.label">
                  <q-item-label class="d-header-links__group" header aria-hidden="true">
                    <q-icon v-if="link.icon" class="q-mr-sm" :name="link.icon" size="xs" />{{ link.label }}
                  </q-item-label>
                  <d-header-link-item v-for="(child, childIndex) in link.children" :key="childIndex" :link="child" />
                </div>
                <d-header-link-item v-else :link="link" />
              </template>
            </q-list>
          </q-btn-dropdown>
          <d-header-links :links="headerLinks" />
        </div>
        <q-btn
          v-else
          class="filled d-header__brand"
          align="left"
          no-caps
          stretch
          to="/"
        >
          <d-header-brand />
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

  <router-view />

  <!-- ? AFTER router-view on purpose: the drawer is position-fixed, so DOM
       order is visually irrelevant — but in SSR the serialized menu weighs
       ~130 KB (inline SVG icons) and placing it before the content would make
       the LCP block wait for the whole menu to stream in on slow links. -->
  <!-- ? :behavior from the real screen width: QLayout measures its own width
       only after mount, so the default breakpoint logic renders the first
       frame without the drawer and shows it a tick later — a layout shift
       (CLS) on every desktop load -->
  <q-drawer v-if="showSidebar" elevated show-if-above side="left" v-model="layout.menu"
    :behavior="($q.screen.width || 1440) > 1023 ? 'desktop' : 'mobile'"
  >
    <d-menu />
  </q-drawer>

  <d-footer-host />
</q-layout>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMeta, useQuasar } from 'quasar'

import DFooterHost from '../components/DFooterHost.vue'
import DHeaderBrand from '../components/DHeaderBrand.vue'
import DHeaderLinkItem from '../components/DHeaderLinkItem.vue'
import DHeaderLinks from '../components/DHeaderLinks.vue'
import * as MenuLink from '../components/menu-link.js'
import docsectorConfig from 'docsector.config.js'
import * as HeaderConfig from '../header/config.js'
import { createMenuHydration } from '../composables/menu-hydration'
import { move } from '../composables/menu-keys'
import { scrollMenuToActive } from '../composables/menu-scroll'
import { normalizeAiAssistantConfig } from '../ai-assistant/config'
import { allBooks, booksByVersion } from 'virtual:docsector-books'
import { resolveSubpageMeta } from '../frontmatter.js'
import { resolveLocaleMap } from '../i18n/locale-map'
import { resolveRoutePageLayout } from '../page-layout'

defineOptions({ name: 'LayoutDefault' })

const branding = docsectorConfig.branding || {}
const assistantConfig = normalizeAiAssistantConfig(docsectorConfig)
const assistantEnabled = assistantConfig.enabled === true

const route = useRoute()
const router = useRouter()

// ? The sidebar menu is one of the heaviest shell subtrees (~200 entries).
//   Under SSR its markup is already server-rendered with real <a href> links —
//   hydrate it only when the user reaches for it (hover/touch/focus) or right
//   before the first navigation, keeping the initial hydration task (and Total
//   Blocking Time) small. In SPA loads the async component mounts immediately.
const menuHydration = createMenuHydration(router, {
  interactions: ['pointerenter', 'touchstart', 'focusin', 'click'],
  loader: () => import('../components/DMenu.vue'),
  // ? the server menu is in the DOM only while this layout hydrates it
  markup: typeof window !== 'undefined' && window.__DOCSECTOR_HYDRATING__ === true ? document.getElementById('menu') : null
})
const DMenu = defineAsyncComponent({
  loader: menuHydration.loader,
  hydrate: menuHydration.strategy
})
onMounted(menuHydration.settle)
onBeforeUnmount(menuHydration.dispose)
const store = useStore()
const $q = useQuasar()
const { t, locale } = useI18n()

// ! Header links, resolved once from the static config and the static routes
//   (like the sidebar top links), so the server markup and the hydrated
//   header agree: a page of the site opens in place, anything else in a new tab
const onHeaderLinkWarning = process.env.DEV ? message => console.warn(`[docsector] header.links: ${message}`) : undefined
const headerEntries = Object.freeze(HeaderConfig.normalize(docsectorConfig).links.map(link => ({
  ...link,
  attrs: link.href === null ? null : MenuLink.resolve(link.href, router, { onWarning: onHeaderLinkWarning }),
  children: link.children.map(child => ({
    ...child,
    attrs: MenuLink.resolve(child.href, router, { onWarning: onHeaderLinkWarning })
  }))
})))

// : the title slot classes — with links, the smallest slot width (100px
//   steps) that holds the estimated nav centered between two 60px brand
//   columns; past 1600px the links only open from the brand's arrow
const headerFit = (() => {
  if (headerEntries.length === 0) return null

  const width = Math.ceil((HeaderConfig.estimate(headerEntries) + 120) / 100) * 100
  return ['d-header__brand-slot--links', width <= 1600 ? `d-header__brand-slot--fit-${Math.max(width, 500)}` : null]
})()

// : what the header renders — labels in the reader's locale, and the active
//   state of every link (a dropdown is active when one of its sublinks is)
const headerLinks = computed(() => headerEntries.map((link) => {
  const children = link.children.map(child => ({
    label: resolveLocaleMap(child.label, locale.value),
    icon: child.icon ?? undefined,
    attrs: child.attrs,
    active: MenuLink.check(child.attrs.to, route, router)
  }))

  return {
    label: resolveLocaleMap(link.label, locale.value),
    icon: link.icon ?? undefined,
    attrs: link.attrs,
    active: children.length > 0 ? children.some(child => child.active) : MenuLink.check(link.attrs.to, route, router),
    children
  }
}))

const layout = ref({
  // ? open from the very first frame on desktop — waiting for show-if-above
  //   to flip it after mount paints the page without the drawer and then
  //   shifts the whole layout (CLS). width 0 = not measured yet (SSR /
  //   hydration): assume desktop so the server serializes the open drawer;
  //   pre-hydration CSS hides it on small screens (see app.sass).
  menu: ($q.screen.width || 1440) > 1023
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

// ! Quasar's fixed utility color values (mirrors quasar/src/css/core/colors).
//   Resolved statically so server render and client hydration serialize the
//   SAME string — getPaletteColor() needs a live DOM and diverges on SSR.
const quasarUtilityColorValues = Object.freeze({
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  separator: 'rgba(0, 0, 0, 0.12)',
  'dark-separator': 'rgba(255, 255, 255, 0.28)'
})

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

  // ? Isomorphic resolution — server render and client hydration MUST emit the
  //   same string (no getPaletteColor: it needs a live DOM and diverges on SSR)
  if (quasarUtilityColorPattern.test(normalized)) {
    return quasarUtilityColorValues[normalized] || normalized
  }
  if (quasarBrandColorPattern.test(normalized)) {
    // : CSS resolves the brand custom property identically on both sides
    return `var(--q-${normalized})`
  }
  if (quasarPaletteColorPattern.test(normalized)) {
    // ? Palette tokens (e.g. red-5) have no custom property nor a static map —
    //   pass through unchanged (the .d-book-tab CSS carries a sane fallback)
    return normalized
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

// @ Dynamic page title & meta tags
const currentSubpage = computed(() => {
  const segment = route.path.replace(/\/+$/, '').split('/').pop()
  return ['overview', 'showcase', 'vs'].includes(segment) ? segment : 'overview'
})

// ? a showcase/vs file's frontmatter may override the title/description of its
//   own subpage (page.subpageMeta, produced by the frontmatter merge)
const subpageOverride = computed(() => resolveSubpageMeta(
  route.matched[0]?.meta?.subpageMeta,
  currentSubpage.value,
  locale.value
))

const pageTitle = computed(() => {
  if (subpageOverride.value?.title) return subpageOverride.value.title

  const data = route.matched[0]?.meta?.data
  const langData = data?.[locale.value] || data?.['*'] || data?.['en-US'] || Object.values(data || {})[0]
  return langData?.title || ''
})

const pageDescription = computed(() => {
  if (subpageOverride.value?.description) return subpageOverride.value.description

  const description = resolveLocaleMap(route.matched[0]?.meta?.meta?.description, locale.value)
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

  // @ Canonical URL — the trailing-slash form the sitemap and router agree on.
  //   Each page is reachable at both `<route>` and `<route>/`, so declaring one
  //   canonical stops Search Engines from treating them as duplicates (and stops
  //   the "Page with redirect" report on the slash-less variant).
  const siteBaseUrl = String(docsectorConfig.siteUrl || '').replace(/\/+$/g, '')
  const routePath = route.path || '/'
  const canonicalPath = routePath !== '/' && !routePath.endsWith('/')
    ? `${routePath}/`
    : routePath
  const canonical = `${siteBaseUrl}${canonicalPath}`

  return {
    title,
    link: {
      canonical: { rel: 'canonical', href: canonical }
    },
    meta: {
      description: { name: 'description', content: description },
      ogTitle: { property: 'og:title', content: title },
      ogDescription: { property: 'og:description', content: description },
      ogType: { property: 'og:type', content: 'article' },
      ogUrl: { property: 'og:url', content: canonical },
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
    // ? a hidden page is off the tree, so it never becomes the tab's landing
    if (topRoute.meta?.menu?.hidden === true) continue

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

// @ Sidebar position on load: DMenu only hydrates on interaction (or right
//   before the first navigation), so its own mounted scroll never runs for a
//   fresh visit — center the active item on the server-rendered markup from
//   here (pure DOM, keeps the menu asleep), with the same smooth glide route
//   changes use.
//   Double rAF: let the pre-hydration layout CSS settle the drawer first.
onMounted(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollMenuToActive()
    })
  })
})
</script>

<style lang="sass">
// Header
.d-header
  &.left-btn
    .q-toolbar
      padding: 0
  // ? Viewport-dependent bits are pure CSS on purpose: media queries apply to
  //   the REAL viewport from the very first (server-rendered) paint, while
  //   $q.screen class bindings only settle after Screen measures — shifting
  //   the brand on every load (CLS)
  .d-header__brand-slot
    justify-content: flex-start
  .d-header__brand
    min-width: 0
    max-width: 100%
    padding-inline: 16px
    @media (max-width: 599px)
      padding-inline: 8px
  // ? With header links the brand is a split QBtnDropdown: its classes land on
  //   the QBtnGroup, so the home button gets the brand padding itself — the
  //   toolbar must stay 52px tall, which height-hint relies on (CLS)
  .d-header__brand.q-btn-group
    padding-inline: 0
    box-shadow: none
    > .q-btn-dropdown--current
      min-width: 0
      padding: 13px 16px
      @media (max-width: 599px)
        padding-inline: 8px
  .d-header__brand .q-btn-dropdown__arrow-container
    padding-inline: 4px
  // ? the centered links show only where they fit: the title slot is a size
  //   container and its fit-N class (from the estimated nav width) switches
  //   them on from an N px wide slot — the sidebar, the assistant and the
  //   viewport are all accounted for. Otherwise, the brand's arrow opens them.
  //   A grid centers them exactly; the brand truncates first, down to its logo
  .d-header__brand-slot--links
    container: d-header-slot / inline-size
  .d-header__bar
    display: flex
    flex: 1 1 auto
    align-items: stretch
    min-width: 0
    > .d-header__brand
      justify-self: start
  .d-header__nav
    display: none
    align-items: stretch
    justify-self: center
    .q-btn:before
      box-shadow: none
  @for $step from 5 through 16
    @container d-header-slot (min-width: #{$step * 100}px)
      .d-header__brand-slot--fit-#{$step * 100}
        .d-header__bar
          display: grid
          grid-template-columns: minmax(3.75rem, 1fr) auto minmax(0, 1fr)
        .d-header__nav
          display: flex
        .d-header__brand .q-btn-dropdown__arrow-container
          display: none
  .d-header__link
    font-weight: 400
  .d-header__link--active
    background: rgba(255, 255, 255, 0.16)
    box-shadow: inset 0 -2px 0 currentColor
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

// ? the header links menus render in a portal, outside .d-header
.d-header-links__menu
  min-width: 200px
  // ? the current page's row: the sidebar's active treatment, readable in
  //   both themes (Quasar's primary text alone reads 2.4:1 in dark mode)
  .q-item--active
    color: inherit
    font-weight: 500
    background-color: rgba(189, 189, 189, 0.35)
.body--dark .d-header-links__menu .q-item--active
  color: var(--q-primary-in-dark-bg)
  background-color: rgba(255, 255, 255, 0.08)
// ? text only screen readers announce (the header links' new-tab cue)
.d-sr-only
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  padding: 0
  overflow: hidden
  clip: rect(0, 0, 0, 0)
  white-space: nowrap
  border: 0
  .d-header-links__group
    display: flex
    align-items: center
    padding: 12px 16px 4px
</style>
