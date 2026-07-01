<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, scroll, openURL } from 'quasar'
import { useI18n } from 'vue-i18n'

import DMenuItem from './DMenuItem.vue'
import docsectorConfig from 'docsector.config.js'
import { allBooks, booksByVersion, bookTagsByVersion, versions } from 'virtual:docsector-books'
import { namespacedLabelI18nPath, routeSubpageSourceI18nPath } from '../i18n/path'
import { matchesBookSearchTerm } from '../search/book-search'

const $q = useQuasar()
const $route = useRoute()
const $router = useRouter()
const { t, te, tm } = useI18n()

const branding = docsectorConfig.branding || {}
const links = docsectorConfig.links || {}
const github = docsectorConfig.github || {}

const term = ref(null)
const founds = ref(false)
const items = ref([])
const scrolling = ref(null)
const isMenuHovered = ref(false)
const pendingScroll = ref(false)
const githubStars = ref(null)

const subpage = computed(() => {
  const parent = $route.matched[0]?.path
  const child = $route.matched[1]?.path
  if (!parent || !child) return '/overview'
  return child.substring(parent.length)
})

const activeVersionId = computed(() => {
  return $route.matched?.[0]?.meta?.version ?? versions?.[0]?.id ?? ''
})

const activeBooks = computed(() => {
  if (activeVersionId.value && booksByVersion?.[activeVersionId.value]?.allBooks) {
    return booksByVersion[activeVersionId.value].allBooks
  }

  return allBooks || []
})

const activeBookTags = computed(() => {
  if (activeVersionId.value && bookTagsByVersion?.[activeVersionId.value]) {
    return bookTagsByVersion[activeVersionId.value]
  }

  return {}
})

const draftReleaseStatuses = new Set(['draft', 'unreleased', 'preview', 'next'])

const versionStatusLabel = (label, releaseStatus) => {
  const normalizedStatus = String(releaseStatus || '').toLowerCase()
  const normalizedLabel = String(label || normalizedStatus).toLowerCase()
  const statusKey = normalizedStatus ? `menu.version.status.${normalizedStatus}` : null
  const labelKey = normalizedLabel ? `menu.version.status.${normalizedLabel}` : null

  if (statusKey && (!label || normalizedLabel === normalizedStatus) && te(statusKey)) {
    return t(statusKey)
  }

  if (labelKey && te(labelKey)) {
    return t(labelKey)
  }

  return label || releaseStatus
}

const normalizeVersionBadge = (item) => {
  const configuredStatus = item.deprecated === true
    ? 'deprecated'
    : (item.releaseStatus || item.status)
  const explicitlyReleased = item.released !== undefined ? item.released !== false : null
  const released = configuredStatus === 'deprecated'
    ? true
    : (explicitlyReleased ?? !draftReleaseStatuses.has(String(configuredStatus || '').toLowerCase()))
  const releaseStatus = configuredStatus || (released ? 'released' : 'draft')
  const rawBadge = item.badge ?? item.releaseBadge
  const deprecated = releaseStatus === 'deprecated'
  const defaultColor = deprecated ? 'negative' : (released ? 'positive' : 'warning')
  const defaultTextColor = (deprecated || released) ? 'white' : 'dark'

  if (rawBadge === false || rawBadge === null) {
    return { label: versionStatusLabel(releaseStatus, releaseStatus), color: defaultColor, textColor: defaultTextColor }
  }

  if (typeof rawBadge === 'string') {
    return { label: versionStatusLabel(rawBadge, releaseStatus), color: defaultColor, textColor: defaultTextColor }
  }

  if (typeof rawBadge === 'object' && rawBadge !== null) {
    const label = rawBadge.label || rawBadge.text || releaseStatus
    if (!label) {
      return null
    }

    return {
      ...rawBadge,
      label: versionStatusLabel(label, releaseStatus),
      color: rawBadge.color || defaultColor,
      textColor: rawBadge.textColor || defaultTextColor
    }
  }

  return { label: versionStatusLabel(releaseStatus, releaseStatus), color: defaultColor, textColor: defaultTextColor }
}

const versionOptions = computed(() => {
  return (versions || [])
    .filter(item => item && item.id)
    .map(item => ({
      label: item.label || item.id,
      value: item.id,
      badge: normalizeVersionBadge(item),
      released: item.released !== false,
      deprecated: item.deprecated === true || item.releaseStatus === 'deprecated' || item.status === 'deprecated',
      releaseStatus: item.releaseStatus || item.status || (item.released === false ? 'draft' : 'released')
    }))
})

const activeVersionOption = computed(() => {
  return versionOptions.value.find(item => item.value === activeVersionId.value) || null
})

const version = computed({
  get: () => activeVersionId.value,
  set: (versionId) => onVersionChange(versionId)
})

const defaultBookId = computed(() => {
  const sortedBooks = [...activeBooks.value]
    .filter(book => book && typeof book.id === 'string' && book.id.length > 0)
    .sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
      const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })

  return sortedBooks[0]?.id || null
})

const currentBookId = computed(() => {
  const routeBook = $route.matched?.[0]?.meta?.book ?? $route.meta?.book ?? null
  if (routeBook && routeBook !== 'home') {
    return routeBook
  }

  return defaultBookId.value
})

const normalizeRoutePath = (path) => {
  const normalized = String(path || '').trim()
  if (normalized === '' || normalized === '/') {
    return '/'
  }

  const sanitized = normalized.replace(/\/+$/, '')
  return sanitized === '' ? '/' : sanitized
}

const getTopRoutes = () => {
  return ($router.options.routes || []).slice(0, -2).filter(route => route?.meta?.menu?.hidden !== true)
}

const routeHasSubpage = (route, subpageName) => {
  return (route.children || []).some(child => child.path === subpageName)
}

const routeToSubpagePath = (route, subpageName) => {
  return `${route.path.replace(/\/$/, '')}/${subpageName}/`
}

const getCurrentSubpageName = () => {
  return String(subpage.value || '/overview').replace(/^\/+|\/+$/g, '') || 'overview'
}

const getFirstRoutePathByVersion = (versionId, preferredBook = null) => {
  const routes = getTopRoutes()

  for (const preferBook of [preferredBook, null]) {
    for (const route of routes) {
      if (route?.meta?.version !== versionId) continue
      if (preferBook && (route.meta?.book ?? route.meta?.type) !== preferBook) continue
      if (!routeHasSubpage(route, 'overview')) continue

      const hasInternalLink = typeof route.meta?.link?.to === 'string' && route.meta.link.to.trim().length > 0
      if (hasInternalLink) continue

      return routeToSubpagePath(route, 'overview')
    }
  }

  return '/'
}

const getEquivalentRoutePath = (versionId) => {
  const routeMeta = $route.matched?.[0]?.meta || {}
  const book = routeMeta.book ?? routeMeta.type ?? currentBookId.value
  const pagePath = routeMeta.pagePath
  const subpageName = getCurrentSubpageName()

  if (book && typeof pagePath === 'string') {
    const equivalentRoute = getTopRoutes().find(route => {
      return route?.meta?.version === versionId &&
        (route.meta?.book ?? route.meta?.type) === book &&
        route.meta?.pagePath === pagePath &&
        routeHasSubpage(route, subpageName)
    })

    if (equivalentRoute) {
      return routeToSubpagePath(equivalentRoute, subpageName)
    }
  }

  return getFirstRoutePathByVersion(versionId, book)
}

function onVersionChange (versionId) {
  if (!versionId || versionId === activeVersionId.value) return

  const targetVersion = (versions || []).find(item => item.id === versionId)
  if (!targetVersion) return

  if (typeof targetVersion.url === 'string' && targetVersion.url.trim().length > 0) {
    openURL(targetVersion.url)
    return
  }

  const targetPath = getEquivalentRoutePath(versionId)
  if (normalizeRoutePath($route.path) !== normalizeRoutePath(targetPath)) {
    $router.push(targetPath)
  }
}

const searchTerm = (term) => {
  if (term.length > 1) {
    term = term.toLowerCase()
    const locale = $q.localStorage.getItem('setting.language')
    founds.value = []

    for (const group of items.value) {
      searchTermIterate(group, term, locale)
    }
  } else {
    founds.value = false
  }
}

const searchTermIterate = (items, term, locale) => {
  if (Array.isArray(items)) {
    for (const subitems of items) {
      searchTermIterate(subitems, term, locale)
    }
  } else if (typeof items === 'object') {
    const item = items
    const path = item.path
    const routeBook = item.meta?.book ?? item.meta?.type ?? null
    const tagPath = item.meta?.unversionedPath || path
    founds.value[path] = false

    // @ search in tags declared by active book index
    if (routeBook) {
      const tagsByLocale = activeBookTags.value?.[routeBook] || {}
      founds.value[path] = matchesBookSearchTerm(tagsByLocale, locale, tagPath, term)
    }

    // @ search in Page content
    if (founds.value[path] === false) {
      founds.value[path] = searchTermInI18nTexts(path, term, locale)
      if (founds.value[path] === false && locale !== 'en-US') {
        founds.value[path] = searchTermInI18nTexts(path, term, 'en-US')
      }
    }
  }
}

const searchTermInI18nTexts = (route, term, locale) => {
  const subpages = ['overview', 'showcase', 'vs']
  let source = null
  let found = false
  for (const subpage of subpages) {
    const path = routeSubpageSourceI18nPath(route, subpage)
    const msgExists = te(path, locale)
    if (msgExists) {
      source = tm(path, locale)
    }

    if (msgExists && source.toLowerCase().includes(term)) {
      found = true
      break
    }
  }
  return found
}

const clearSearchTerm = () => {
  term.value = ''
  searchTerm('')
  return true
}

const getMenuItemHeaderLabel = (meta) => {
  const label = meta.menu.header.label
  if (label[0] === '.') { // Node path
    const book = meta.book ?? meta.type ?? 'manual'
    const path = namespacedLabelI18nPath(book, label)
    return t(path)
  }
  return label // String raw
}

const executeScrollToActiveMenuItem = () => {
  const menu = document.getElementById('menu')
  if (!menu) {
    return
  }

  const menuItemActive = (menu.getElementsByClassName('q-router-link--active'))[0]
  if (!menuItemActive || typeof menuItemActive !== 'object') {
    return
  }

  const offsetTop1 = menuItemActive.closest('.menu-list-expansion')?.offsetTop ?? 0
  const offsetTop2 = menuItemActive.offsetTop

  const innerHeightBy2 = window.innerHeight / 2

  const searchBarHeight = 50
  let expansionHeaderHeight = 0
  if (offsetTop1 > 0) {
    expansionHeaderHeight = 45
  }
  const fixedHeight = searchBarHeight + expansionHeaderHeight

  const target = scroll.getScrollTarget(menuItemActive)
  const offset = (offsetTop1 + offsetTop2) - innerHeightBy2 + fixedHeight
  const duration = 300

  if (offset > 0) {
    scroll.setVerticalScrollPosition(target, offset, duration)
  }
}

const flushPendingMenuScroll = () => {
  if (!pendingScroll.value || isMenuHovered.value) {
    return
  }

  if (scrolling.value) {
    clearTimeout(scrolling.value)
    scrolling.value = null
  }

  pendingScroll.value = false
  executeScrollToActiveMenuItem()
}

const scrollToActiveMenuItem = () => {
  pendingScroll.value = true

  if (scrolling.value) {
    clearTimeout(scrolling.value)
    scrolling.value = null
  }

  if (isMenuHovered.value) {
    return
  }

  scrolling.value = setTimeout(() => {
    scrolling.value = null
    flushPendingMenuScroll()
  }, 1500)
}

const handleMenuMouseEnter = () => {
  isMenuHovered.value = true
}

const handleMenuMouseLeave = () => {
  isMenuHovered.value = false
  flushPendingMenuScroll()
}

// * GitHub stars
// # Compact display: 1.2k, 3.4M
const formatStars = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(count)
}

// # Fetch stargazers_count (opt-in via github.stars), cached in localStorage (6h TTL)
const loadGithubStars = async () => {
  // ? feature disabled or no repo link
  if (github.stars !== true || !links.github) {
    return
  }

  // ? derive owner/repo from links.github
  const match = String(links.github).match(/github\.com\/([^/]+)\/([^/#?]+)/)
  if (!match) {
    return
  }
  const repo = `${match[1]}/${match[2].replace(/\.git$/, '')}`

  // ! cache setup
  const cacheKey = `docsector.githubStars.${repo}`
  const TTL = 6 * 60 * 60 * 1000

  // @ show cached value first (instant paint), even if stale
  const cached = $q.localStorage.getItem(cacheKey)
  if (cached && typeof cached.count === 'number') {
    githubStars.value = cached.count
    // ? fresh enough — skip network
    if ((Date.now() - cached.ts) < TTL) {
      return
    }
  }

  // @ refresh from GitHub API (unauthenticated: 60 req/hour/IP)
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
    // ? rate-limited / not found — keep stale cache
    if (!response.ok) {
      return
    }

    const data = await response.json()
    if (typeof data.stargazers_count === 'number') {
      githubStars.value = data.stargazers_count
      $q.localStorage.set(cacheKey, { count: data.stargazers_count, ts: Date.now() })
    }
  } catch {
    // ? offline / network error — stale cache already shown above
  }
}

onMounted(() => {
  scrollToActiveMenuItem()

  loadGithubStars()

  $router.afterEach((to, from) => {
    if (!to.hash || (from.path !== to.path)) {
      scrollToActiveMenuItem()
    }
  })
})

onBeforeUnmount(() => {
  if (scrolling.value) {
    clearTimeout(scrolling.value)
  }

  isMenuHovered.value = false
  pendingScroll.value = false
})

const buildMenuItems = () => {
  const routes = getTopRoutes()
  const activeBook = currentBookId.value
  const activeVersion = activeVersionId.value

  const filteredRoutes = routes.filter(route => {
    const routeBook = route?.meta?.book ?? route?.meta?.type
    if (activeVersion && route?.meta?.version !== activeVersion) return false
    if (!activeBook) return true
    return routeBook === activeBook
  })

  const itemsArray = []

  let nodeBasepath = ''
  let nodeIndex = 0
  for (const [index, route] of filteredRoutes.entries()) {
    const item = Object.freeze({
      path: route.path,
      meta: route.meta
    })

    // # Route
  const basepath = route.meta?.menuGroupPath || route.path.split('/')[2]
    const header = route.meta?.menu?.header

    if (header !== undefined && basepath !== nodeBasepath) {
      nodeBasepath = basepath
      nodeIndex = index
      itemsArray[index] = []
    } else if (header === undefined && basepath !== nodeBasepath) {
      nodeBasepath = ''
    }

    if (nodeBasepath !== '') {
      itemsArray[nodeIndex].push(item)
    } else {
      itemsArray.push(item)
    }
  }

  return Object.freeze(itemsArray.filter(item => item !== undefined))
}

const rebuildItems = () => {
  items.value = buildMenuItems()
}

rebuildItems()
watch([currentBookId, activeVersionId], rebuildItems)
</script>

<template>
<transition appear enter-active-class="animated zoomIn" leave-active-class="animated zoomOut">
  <q-input for="search" v-model="term" @update:model-value="searchTerm" :placeholder="t('menu.search')" :debounce="300">
    <template v-slot:prepend>
      <q-icon class="q-ml-sm" name="search" />
    </template>
    <template v-slot:append>
      <q-icon class="cursor-pointer clear" v-if="term" name="clear" @click="clearSearchTerm" />
    </template>
  </q-input>
</transition>

<q-scroll-area id="menu"
  @mouseenter="handleMenuMouseEnter"
  @mouseleave="handleMenuMouseLeave"
  :visible="true"
  :class="$q.dark.isActive ? '' : 'bg-grey-2'"
>
  <div class="row flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'" style="height: 115px;">
    <div class="col-5">
      <img class="q-mr-md" v-if="branding.logo" :src="branding.logo" :alt="branding.name" width="85" height="85" style="float: right;" />
    </div>
    <div class="col-7">
      <div class="text-weight-medium">{{ branding.name || 'Docsector' }}</div>
      <div class="text-caption q-pt-xs">{{ t('system.documentation') }}</div>
      <q-select class="q-mr-md"
        v-model="version" :options="versionOptions"
        emit-value map-options
        dense options-dense
        behavior="menu"
      >
        <template v-slot:selected>
          <div v-if="activeVersionOption" class="version-select-option">
            <span class="version-select-label">{{ activeVersionOption.label }}</span>
            <q-badge
              v-if="activeVersionOption.badge"
              class="version-select-badge"
              :color="activeVersionOption.badge.color || 'warning'"
              :text-color="activeVersionOption.badge.textColor || 'dark'"
              :outline="activeVersionOption.badge.outline === true"
            >
              {{ activeVersionOption.badge.label }}
            </q-badge>
          </div>
        </template>
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <div class="version-select-option">
                <span class="version-select-label">{{ scope.opt.label }}</span>
                <q-badge
                  v-if="scope.opt.badge"
                  class="version-select-badge"
                  :color="scope.opt.badge.color || 'warning'"
                  :text-color="scope.opt.badge.textColor || 'dark'"
                  :outline="scope.opt.badge.outline === true"
                >
                  {{ scope.opt.badge.label }}
                </q-badge>
              </div>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>

  <q-list no-border link inset-delimiter role="list">
    <q-item to="/" exact>
      <q-item-section side>
        <q-icon name="home" />
      </q-item-section>
      <q-item-section>{{ t('menu.home') }}</q-item-section>
    </q-item>

    <li role="listitem">
      <q-separator role="separator" />
    </li>
    <q-item v-if="links.changelog" :href="links.changelog" target="_blank">
      <q-item-section side>
        <q-icon name="assignment" />
      </q-item-section>
      <q-item-section>{{ t('menu.changelog') }}</q-item-section>
      <q-item-section side>
        <q-icon name="open_in_new" size="xs" />
      </q-item-section>
    </q-item>
    <q-item v-if="links.roadmap" :href="links.roadmap" target="_blank">
      <q-item-section side>
        <q-icon name="playlist_add_check_circle" />
      </q-item-section>
      <q-item-section>{{ t('menu.roadmap') }}</q-item-section>
      <q-item-section side>
        <q-icon name="open_in_new" size="xs" />
      </q-item-section>
    </q-item>
    <q-item v-if="links.sponsor" :href="links.sponsor" target="_blank">
      <q-item-section side>
        <q-icon name="favorite" color="red" />
      </q-item-section>
      <q-item-section>{{ t('menu.sponsor') }}</q-item-section>
      <q-item-section side>
        <q-icon name="open_in_new" size="xs" />
      </q-item-section>
    </q-item>

    <template v-if="links.explore && links.explore.length">
      <li role="listitem">
        <q-separator role="separator" spaced />
        <q-item-section side class="q-ml-md">{{ t('menu.explore') }}</q-item-section>
      </li>
      <q-item v-for="link in links.explore" :key="link.url" :href="link.url" target="_blank">
        <q-item-section>{{ link.label }}</q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" size="xs" />
        </q-item-section>
      </q-item>
    </template>
  </q-list>

  <q-separator class="separator list" />

  <q-list v-if="items !== null && items.constructor === Array && items.length > 0"
    no-border link inset-delimiter role="list"
  >
    <template v-for="(item, index) in items" :key="index">
      <q-expansion-item class="menu-list-expansion"
        v-if="item && item.constructor === Array"
        expand-separator
        default-opened
      >
        <template v-slot:header>
          <q-item-section>
            <div class="row justify-center text-center">
              <div class="col">
                <q-icon :name="item[0].meta.menu.header.icon" size="1.5rem" />
                <span class="q-ml-md">{{ getMenuItemHeaderLabel(item[0].meta) }}</span>
              </div>
            </div>
          </q-item-section>
        </template>
        <template v-for="(subitem, subindex) in item" :key="subindex">
          <d-menu-item
            :items="items.length"
            :subitem="subitem"
            :subindex="subindex"
            :subpage="subpage"
            :founds="founds"
          />
        </template>
      </q-expansion-item>
      <d-menu-item v-else-if="item && item.constructor === Object"
        :items="items.length"
        :subitem="item"
        :subindex="index"
        :subpage="subpage"
        :founds="founds"
      />
    </template>
  </q-list>
</q-scroll-area>

<div class="menu-social" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
  <div class="col text-center">
    <q-btn-group flat>
      <q-btn v-if="links.email" icon="fas fa-at" size="sm" @click="openURL('mailto:' + links.email)" aria-label="Email">
        <q-tooltip>Email</q-tooltip>
      </q-btn>
      <q-btn v-if="links.chat" icon="fas fa-comment" size="sm" @click="openURL(links.chat)" aria-label="Chat">
        <q-tooltip>Chat</q-tooltip>
      </q-btn>
      <q-btn v-if="links.discussions" icon="fas fa-comments" size="sm" @click="openURL(links.discussions)" aria-label="Discussions">
        <q-tooltip>Discussions</q-tooltip>
      </q-btn>
      <q-btn v-if="links.github" icon="fab fa-github" size="sm" @click="openURL(links.github)" aria-label="Github">
        <q-badge v-if="githubStars !== null" class="menu-social__stars" floating rounded>{{ formatStars(githubStars) }}</q-badge>
        <q-tooltip>Github</q-tooltip>
      </q-btn>
    </q-btn-group>
  </div>
</div>
</template>

<style lang="sass">
body.body--dark
  --d-menu-subheader-txt-color: #a8a8a8
  --d-menu-expansion-bg-color: rgb(48, 48, 48)
  --d-menu-item-opacity: 0.03
body.body--light
  --d-menu-subheader-txt-color: #363636
  --d-menu-expansion-bg-color: rgb(245, 245, 245)
  --d-menu-item-opacity: 0.015

.menu-social
  display: flex
  align-items: center
  min-height: 50px
  border-top: 3px solid rgba(0, 0, 0, 0.06)
  padding-bottom: env(safe-area-inset-bottom, 0px)

  .col
    width: 100%

  // ? allow the star badge to overflow the button/group (clipped by default)
  .q-btn-group,
  .q-btn
    overflow: visible

  .menu-social__stars
    font-size: 9px
    line-height: 1

#menu
  width: 100%
  height: calc(100% - 50px - 50px - env(safe-area-inset-bottom, 0px))

  .q-list
    padding: 8px 0

    .menu-list-expansion
      box-shadow: 0px -1px 3px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.14), 0 2px 1px -1px rgba(0, 0, 0, 0.12)
      margin-top: 5px

      .q-item[role="button"]
        position: sticky
        position: -webkit-sticky
        position: -moz-sticky
        position: -ms-sticky
        position: -o-sticky
        width: 100%
        top: -1px
        z-index: 3
        background-color: var(--d-menu-expansion-bg-color)
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.14), 0 2px 1px -1px rgba(0, 0, 0, 0.12)

      .separator
        margin: 5px auto 10px

    .q-item
      padding: 8px 12px
      min-height: 45px
      margin-bottom: 2px
      &.q-hoverable > .q-focus-helper
        background-color: currentColor
        opacity: var(--d-menu-item-opacity)
      &.q-hoverable:hover > .q-focus-helper
        background-color: currentColor
        opacity: 0.15 !important

    .q-item.q-router-link--active
      color: black
      background-color: rgba(189, 189, 189, 0.7)
      .q-item__section--side:not(.q-item__section--avatar)
          .q-icon
            color: black

  .page-status
    margin-right: 7px

  // ? stick subheader section headers to the top while scrolling (like expansion headers)
  .subheader-section
    position: sticky
    position: -webkit-sticky
    top: -1px
    z-index: 2
    background-color: var(--d-menu-expansion-bg-color)

  // ? inside an expansion, stack the subheader below the sticky expansion header (~45px) instead of behind it
  .menu-list-expansion .subheader-section
    top: 44px

  .label
    color: var(--d-menu-subheader-txt-color)

    &.header
      text-align: center
      min-height: 32px
      > div
        padding-bottom: 7px
        padding-top: 10px

      .q-icon
        padding-right: 5px
    &.subheader
      text-align: left
      padding-bottom: 5px
      padding-left: 10px
    span
      color: #363636

  li
    display: block
  .separator
    margin: 5px 0
    &.list
      height: 3px
      margin: 0
    &.page
      height: 3px
    &.subpage
      height: 1px
    &.partial
      margin: 3px auto
      width: 30px
      height: 3px

.version-select-option
  display: flex
  align-items: center
  gap: 6px
  min-width: 0
  max-width: 100%

.version-select-label
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.version-select-badge
  flex: 0 0 auto
  font-size: 10px
  line-height: 1

// Search
label[for="search"]
  z-index: 2

  .q-field__control,
  .q-field__marginal
    height: 50px

  i.clear
    padding: 13px 8px
</style>
