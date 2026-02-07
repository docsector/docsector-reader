<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, scroll, openURL } from 'quasar'
import { useI18n } from 'vue-i18n'

import tags from 'src/i18n/tags.hjson'
import DMenuItem from './DMenuItem.vue'
import docsectorConfig from 'docsector.config.js'

const $q = useQuasar()
const $route = useRoute()
const $router = useRouter()
const { t, te, tm } = useI18n()

const branding = docsectorConfig.branding || {}
const links = docsectorConfig.links || {}

const term = ref(null)
const founds = ref(false)
const version = ref(branding.version || 'v0.x')
const versions = ref(branding.versions || ['v0.x'])
const items = ref([])
const scrolling = ref(null)

const subpage = computed(() => {
  const parent = $route.matched[0]?.path
  const child = $route.matched[1]?.path
  return child.substring(parent.length)
})

const searchTerm = (term) => {
  if (term.length > 1) {
    term = term.toLowerCase()
    const locale = $q.localStorage.getItem('setting.language')
    founds.value = []

    for (const [index, items] of items.value.entries()) {
      searchTermIterate(items, term, locale)
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
    founds.value[path] = false

    // @ search in i18n/tags.hjson
    if (tags[locale] && tags[locale].length > 0) {
      founds.value[path] = tags[locale][path]?.indexOf(term) !== -1
      if (founds.value[path] === false && locale !== 'en-US') {
        founds.value[path] = tags['en-US'][path]?.indexOf(term) !== -1
      }
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
    const path = `_${route.replace(/_$/, '').replace(/\//g, '.')}.${subpage}.source`
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
    const path = `_.${meta.type}${label}._`
    if (te(path)) {
      return t(path)
    }
    return t(path, 'en-US')
  }
  return label // String raw
}

const scrollToActiveMenuItem = () => {
  if (scrolling.value) {
    clearTimeout(scrolling.value)
  }

  scrolling.value = setTimeout(() => {
    const menu = document.getElementById('menu')
    if (menu) {
      const menuItemActive = (menu.getElementsByClassName('q-router-link--active'))[0]
      if (menuItemActive && typeof menuItemActive === 'object') {
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
    }
    scrolling.value = null
  }, 1500)
}

onMounted(() => {
  scrollToActiveMenuItem()

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
})

// # Events
// Create
const routes = $router.options.routes.slice(0, -2) // Delete last 2 routes
const itemsArray = []

let nodeBasepath = ''
let nodeIndex = 0
for (const [index, route] of routes.entries()) {
  const item = Object.freeze({
    path: route.path,
    meta: route.meta
  })
  // # Route
  const basepath = route.path.split('/')[2]
  const header = route.meta.menu.header

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

items.value = Object.freeze(itemsArray.filter(item => item !== undefined))
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
        v-model="version" :options="versions"
        dense options-dense
        behavior="menu"
      />
    </div>
  </div>

  <q-separator class="separator list" />
  <div class="row" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
    <div class="col text-center">
      <q-btn-group flat>
        <q-btn v-if="links.github" icon="fab fa-github" size="sm" @click="openURL(links.github)" aria-label="Github">
          <q-tooltip>Github</q-tooltip>
        </q-btn>
        <q-btn v-if="links.discussions" icon="fas fa-comments" size="sm" @click="openURL(links.discussions)" aria-label="Discussions">
          <q-tooltip>Discussions</q-tooltip>
        </q-btn>
        <q-btn v-if="links.chat" icon="fas fa-comment" size="sm" @click="openURL(links.chat)" aria-label="Chat">
          <q-tooltip>Chat</q-tooltip>
        </q-btn>
        <q-btn v-if="links.email" icon="fas fa-at" size="sm" @click="openURL('mailto:' + links.email)" aria-label="Email">
          <q-tooltip>Email</q-tooltip>
        </q-btn>
      </q-btn-group>
    </div>
  </div>
  <q-separator class="separator list" />

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

#menu
  width: 100%
  height: calc(100% - 50px)

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
        margin: 0 auto

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

// Search
label[for="search"]
  z-index: 2

  .q-field__control,
  .q-field__marginal
    height: 50px

  i.clear
    padding: 13px 8px
</style>
