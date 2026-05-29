<script setup>
import { computed, ref, watch } from 'vue'
import { mdiClose, mdiMagnify } from '@quasar/extras/mdi-v7'
import { useRouter } from 'vue-router'

import DBlockApiEntry from './DBlockApiEntry.js'
import {
  createApiBlockModel,
  defaultInnerTabName,
  getApiCount,
  getFilteredApi
} from './api-block-model'

const BASE_URL = import.meta.env.BASE_URL || '/'
const router = useRouter()

defineOptions({
  name: 'DBlockApi'
})

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  pageLink: Boolean
})

const inputRef = ref(null)
const filter = ref('')
const loading = ref(true)
const errorMessage = ref('')
const apiModel = ref(createApiBlockModel(props.src, {}))
const currentTab = ref(null)
const currentInnerTab = ref(defaultInnerTabName)
const scrollAreaHeights = ref({})

const SCROLL_AREA_MAX_HEIGHT = 640

let requestIndex = 0

const inputIcon = computed(() => (filter.value !== '' ? mdiClose : mdiMagnify))
const nameBanner = computed(() => props.title || apiModel.value.title || 'API reference')
const nothingToShow = computed(() => apiModel.value.nothingToShow)
const tabsList = computed(() => apiModel.value.tabs)
const innerTabsList = computed(() => apiModel.value.innerTabs)
const filteredApi = computed(() => {
  return getFilteredApi(
    apiModel.value.api,
    filter.value,
    tabsList.value,
    innerTabsList.value
  )
})
const filteredApiCount = computed(() => {
  return getApiCount(filteredApi.value, tabsList.value, innerTabsList.value)
})
const docsLink = computed(() => {
  if (!props.pageLink || !apiModel.value.docsLink) {
    return ''
  }

  return apiModel.value.docsLink
})

watch(tabsList, (tabs) => {
  currentTab.value = tabs[0] || null
}, {
  immediate: true
})

watch(currentTab, (value) => {
  const nextInnerTabs = innerTabsList.value[value] || [defaultInnerTabName]
  currentInnerTab.value = nextInnerTabs[0]
})

watch(() => props.src, () => {
  loadApi()
}, {
  immediate: true
})

function normalizeResourcePath(value = '') {
  const raw = String(value || '').trim()

  if (raw === '') {
    return ''
  }

  if (/^(?:[a-z]+:)?\/\//i.test(raw)) {
    return raw
  }

  const trimmedBase = String(BASE_URL).replace(/\/$/, '')

  if (raw.startsWith('/')) {
    return `${trimmedBase}${raw}` || raw
  }

  const normalized = raw.replace(/^\.\//, '')

  return `${trimmedBase}/${normalized}`
}

async function loadApi() {
  const currentRequest = ++requestIndex

  loading.value = true
  errorMessage.value = ''
  filter.value = ''
  apiModel.value = createApiBlockModel(props.src, {})
  scrollAreaHeights.value = {}

  const resolvedSrc = normalizeResourcePath(props.src)

  if (!resolvedSrc) {
    errorMessage.value = 'API source is missing.'
    loading.value = false
    return
  }

  try {
    const response = await fetch(resolvedSrc, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Unable to load API JSON (${response.status}).`)
    }

    const json = await response.json()

    if (currentRequest !== requestIndex) {
      return
    }

    apiModel.value = createApiBlockModel(props.src, json)
  } catch (error) {
    if (currentRequest !== requestIndex) {
      return
    }

    errorMessage.value = error?.message || `Unable to load API JSON: ${props.src}`
  } finally {
    if (currentRequest === requestIndex) {
      loading.value = false
    }
  }
}

function onSearchFieldClick() {
  inputRef.value?.focus()
}

function onFilterClick() {
  if (filter.value !== '') {
    filter.value = ''
    return
  }

  onSearchFieldClick()
}

function onDocsButtonClick() {
  if (!docsLink.value) {
    return
  }

  if (docsLink.value.startsWith('/')) {
    router.push(docsLink.value)
    return
  }

  window.open(docsLink.value, '_blank', 'noopener,noreferrer')
}

function getScrollAreaKey(tab, innerTab = defaultInnerTabName) {
  return `${tab}::${innerTab}`
}

function onScrollContentResize(tab, innerTab, size) {
  const nextHeight = Math.min(Math.max(Math.ceil(size?.height || 0), 1), SCROLL_AREA_MAX_HEIGHT)
  const key = getScrollAreaKey(tab, innerTab)

  if (scrollAreaHeights.value[key] !== nextHeight) {
    scrollAreaHeights.value[key] = nextHeight
  }
}

function getScrollAreaStyle(tab, innerTab = defaultInnerTabName) {
  const key = getScrollAreaKey(tab, innerTab)
  const height = scrollAreaHeights.value[key]

  return {
    height: `${height || SCROLL_AREA_MAX_HEIGHT}px`,
    maxHeight: `${SCROLL_AREA_MAX_HEIGHT}px`
  }
}
</script>

<template>
<q-card class="doc-api q-my-xl" flat>
  <div class="doc-api__toolbar row items-center q-pr-sm">
    <div class="doc-api__title">{{ nameBanner }}</div>

    <div
      class="col doc-api__search-field row items-center no-wrap"
      @click="onSearchFieldClick"
    >
      <input
        ref="inputRef"
        v-model="filter"
        class="col doc-api__search text-right"
        name="filter"
        placeholder="Filter..."
      >
      <q-btn
        :icon="inputIcon"
        class="header-btn q-ml-xs"
        dense
        flat
        round
        @click="onFilterClick"
      />
    </div>

    <q-btn
      v-if="docsLink"
      class="q-ml-sm header-btn doc-api__page-link"
      size="sm"
      padding="xs sm"
      no-caps
      outline
      type="button"
      @click="onDocsButtonClick"
    >
      <q-icon name="launch" />
      <div class="q-ml-xs">Docs</div>
    </q-btn>
  </div>

  <q-linear-progress
    v-if="loading"
    color="primary"
    indeterminate
    class="q-mt-xs"
  />
  <template v-else-if="errorMessage !== ''">
    <q-separator class="doc-api__separator" />
    <div class="doc-api__nothing-to-show">
      <div class="doc-api__feedback-title">{{ errorMessage }}</div>
      <div class="doc-api__feedback-copy">Check the JSON path, network response, or payload shape.</div>
    </div>
  </template>
  <template v-else-if="nothingToShow">
    <q-separator class="doc-api__separator" />
    <div class="doc-api__nothing-to-show">Nothing to display</div>
  </template>
  <template v-else>
    <q-tabs
      v-model="currentTab"
      class="header-tabs"
      active-color="primary"
      indicator-color="primary"
      align="left"
      :breakpoint="0"
    >
      <q-tab
        v-for="tab in tabsList"
        :key="`api-tab-${tab}`"
        :name="tab"
        class="header-btn"
      >
        <div class="row no-wrap items-center">
          <span class="q-mr-xs text-capitalize">{{ tab }}</span>
          <q-badge
            v-if="filteredApiCount[tab]?.overall"
            :label="filteredApiCount[tab].overall"
            color="primary"
          />
        </div>
      </q-tab>
    </q-tabs>

    <q-separator class="doc-api__separator" />

    <q-tab-panels v-model="currentTab" animated>
      <q-tab-panel
        v-for="tab in tabsList"
        :key="tab"
        :name="tab"
        class="q-pa-none"
      >
        <div
          v-if="(innerTabsList[tab] || []).length !== 1"
          class="doc-api__container row no-wrap items-stretch"
        >
          <div class="col-auto">
            <q-tabs
              v-model="currentInnerTab"
              class="header-tabs doc-api__subtabs"
              active-color="primary"
              indicator-color="primary"
              :breakpoint="0"
              vertical
              dense
              shrink
            >
              <q-tab
                v-for="innerTab in innerTabsList[tab]"
                :key="`api-inner-tab-${innerTab}`"
                :name="innerTab"
                class="doc-api__subtabs-item header-btn"
              >
                <div class="row no-wrap items-center self-stretch q-pl-sm">
                  <span class="q-mr-xs text-capitalize">{{ innerTab }}</span>
                  <div class="col" />
                  <q-badge
                    v-if="filteredApiCount[tab]?.category?.[innerTab]"
                    :label="filteredApiCount[tab].category[innerTab]"
                    color="primary"
                  />
                </div>
              </q-tab>
            </q-tabs>
          </div>

          <q-separator vertical class="doc-api__splitter" />

          <q-tab-panels
            v-model="currentInnerTab"
            class="col doc-api__content-panels"
            animated
            transition-prev="slide-down"
            transition-next="slide-up"
          >
            <q-tab-panel
              v-for="innerTab in innerTabsList[tab]"
              :key="innerTab"
              :name="innerTab"
              class="q-pa-none"
            >
              <q-scroll-area
                class="doc-api__scroll-area"
                :style="getScrollAreaStyle(tab, innerTab)"
              >
                <div class="doc-api__scroll-content">
                  <q-resize-observer @resize="onScrollContentResize(tab, innerTab, $event)" />
                  <d-block-api-entry
                    :type="tab"
                    :definition="filteredApi[tab][innerTab]"
                  />
                </div>
              </q-scroll-area>
            </q-tab-panel>
          </q-tab-panels>
        </div>

        <div v-else class="doc-api__container">
          <q-scroll-area
            class="doc-api__scroll-area"
            :style="getScrollAreaStyle(tab, defaultInnerTabName)"
          >
            <div class="doc-api__scroll-content">
              <q-resize-observer @resize="onScrollContentResize(tab, defaultInnerTabName, $event)" />
              <d-block-api-entry
                :type="tab"
                :definition="filteredApi[tab][defaultInnerTabName]"
              />
            </div>
          </q-scroll-area>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </template>
</q-card>
</template>

<style lang="sass">
body.body--light
  --d-api-bg: linear-gradient(180deg, #f7faf5 0%, #ffffff 100%)
  --d-api-border: rgba(52, 85, 54, 0.14)
  --d-api-shadow: rgba(52, 85, 54, 0.08)
  --d-api-surface: rgba(48, 88, 58, 0.04)
  --d-api-text: #26352b
  --d-api-muted: #597060
  --d-api-divider: rgba(52, 85, 54, 0.14)
  --d-api-token-bg: #eef3ed
  --d-api-token-border: rgba(52, 85, 54, 0.14)
  --d-api-token-text: #405148
  --d-api-added-bg: #ffe6e1
  --d-api-added-border: #d95d47
  --d-api-added-text: #b33e28
  --d-api-input-placeholder: #70867a
  --d-api-tab-color: #5d705f
  --d-api-tab-hover: #30483a
  --d-api-tab-active: #6c5928
  --d-api-tab-bg: transparent
  --d-api-tab-bg-hover: rgba(48, 88, 58, 0.05)
  --d-api-tab-bg-active: rgba(48, 88, 58, 0.08)
  --d-api-tab-border: transparent

body.body--dark
  --d-api-bg: linear-gradient(180deg, rgba(226, 255, 234, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)
  --d-api-border: rgba(214, 245, 224, 0.14)
  --d-api-shadow: rgba(0, 0, 0, 0.3)
  --d-api-surface: rgba(255, 255, 255, 0.04)
  --d-api-text: #e8efe9
  --d-api-muted: #a9b9ae
  --d-api-divider: rgba(214, 245, 224, 0.14)
  --d-api-token-bg: rgba(255, 255, 255, 0.06)
  --d-api-token-border: rgba(255, 255, 255, 0.1)
  --d-api-token-text: #d8e4db
  --d-api-added-bg: rgba(217, 93, 71, 0.12)
  --d-api-added-border: #ff7b72
  --d-api-added-text: #ffb0a7
  --d-api-input-placeholder: #92a69c
  --d-api-tab-color: #c5d2ca
  --d-api-tab-hover: #eef7f0
  --d-api-tab-active: #f0d790
  --d-api-tab-bg: rgba(255, 255, 255, 0.06)
  --d-api-tab-bg-hover: rgba(255, 255, 255, 0.1)
  --d-api-tab-bg-active: rgba(240, 215, 144, 0.12)
  --d-api-tab-border: rgba(255, 255, 255, 0.08)

.doc-api
  border: 1px solid var(--d-api-border)
  border-radius: 20px
  background: var(--d-api-bg)
  box-shadow: 0 18px 36px var(--d-api-shadow)
  overflow: hidden

  .header-btn
    color: var(--d-api-muted)
    transition: color 0.2s ease, background-color 0.2s ease

    &:hover
      color: var(--d-api-text)

  .header-tabs
    color: var(--d-api-muted)
    background: transparent

    .q-tabs__content
      gap: 0.375rem

    .q-tab
      color: var(--d-api-tab-color)
      background: var(--d-api-tab-bg)
      border: 1px solid var(--d-api-tab-border)
      border-radius: 12px
      transition: color 0.2s ease, background-color 0.2s ease

      &:hover
        color: var(--d-api-tab-hover)
        background: var(--d-api-tab-bg-hover)

      &.q-tab--active
        color: var(--d-api-tab-active)
        background: var(--d-api-tab-bg-active)

      .q-tab__label,
      .q-tab__content
        color: var(--d-api-tab-active)

      &:not(.q-tab--active)
        .q-tab__label,
        .q-tab__content
          color: inherit

  .q-tab
    min-height: 44px

.doc-api__toolbar
  gap: 0.75rem
  padding: 1rem 1rem 0.75rem

.doc-api__title
  font-size: 1.05rem
  font-weight: 700
  color: var(--d-api-text)

.doc-api__separator.q-separator--horizontal
  margin: 0 !important
  height: 1px !important
  min-height: 1px
  border: 0
  padding: 0
  background: var(--d-api-divider)

.doc-api__splitter.q-separator--vertical
  margin: 0 !important
  width: 1px !important
  min-width: 1px
  height: auto !important
  min-height: 100%
  border: 0
  padding: 0
  flex: 0 0 1px
  align-self: stretch
  background: var(--d-api-divider)
  opacity: 1

.doc-api__container
  align-items: stretch
  max-height: 640px

.doc-api__scroll-area
  width: 100%

  .q-scrollarea__content
    min-width: 100%

.doc-api__scroll-content
  min-width: 100%

.doc-api__content-panels
  background: transparent

.doc-api__nothing-to-show
  padding: 1rem
  color: var(--d-api-muted)

.doc-api__feedback-title
  color: var(--d-api-text)
  font-weight: 600

.doc-api__feedback-copy
  margin-top: 0.25rem

.doc-api__subtabs .q-tabs__content
  padding: 8px 0

.doc-api__subtabs-item
  justify-content: left
  min-height: 36px !important

  .q-tab__content
    width: 100%

.doc-api__subtabs,
.doc-api__subtabs-item
  border-radius: 0 !important

.doc-api__search-field
  cursor: text
  min-width: 10em !important
  padding: 0 0.25rem 0 0.75rem
  border: 1px solid var(--d-api-border)
  border-radius: 999px
  background: var(--d-api-surface)

.doc-api__page-link
  text-decoration: none !important

.doc-api__search
  border: 0
  outline: 0
  background: none
  color: var(--d-api-text)
  width: 1px !important
  height: 37px

  &::placeholder
    color: var(--d-api-input-placeholder)

.doc-api-entry
  padding: 12px 16px 10px
  color: var(--d-api-text)

  .doc-api-entry
    padding: 6px

  & + &
    border-top: 1px solid var(--d-api-divider)

.doc-api-entry__expand-btn
  margin-left: 4px
  color: var(--d-api-muted)

.doc-api-entry__item
  min-height: 0

  & + &
    margin-top: 2px

.doc-api-entry__subitem
  padding: 2px 0 0 8px
  border-radius: 12px

  > div
    border: 1px solid var(--d-api-divider) !important
    border-radius: inherit

  > div + div
    margin-top: 6px

.doc-api-entry__type
  line-height: 22px

.doc-api-entry__value
  color: var(--d-api-muted)
  line-height: 1.45

.doc-api-entry--indent
  padding-left: 8px

.doc-api .doc-token
  margin: 4px
  display: inline-block
  padding: 0.15rem 0.45rem
  border-radius: 999px
  background-color: var(--d-api-token-bg)
  border: 1px solid var(--d-api-token-border)
  color: var(--d-api-token-text)

.doc-api-entry__added-in,
.doc-api-entry__pill
  font-size: 0.78rem
  letter-spacing: 0.04em
  line-height: 1.4em

.doc-api-entry__added-in
  font-size: 0.68rem
  color: var(--d-api-added-text)
  border-color: var(--d-api-added-border)
  background-color: var(--d-api-added-bg)
</style>