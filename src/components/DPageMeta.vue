<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { openURL } from 'quasar'
import { useI18n } from 'vue-i18n'

import docsectorConfig from 'docsector.config.js'

const store = useStore()
const route = useRoute()
const router = useRouter()
const { t, locale, availableLocales, te, tm } = useI18n()

const base = docsectorConfig.github?.editBaseUrl || ''

const status = computed(() => route.meta.status)
const URL = computed(() => {
  const path = route.path.replace(/\/([^/]*)$/, '.$1')
  return `${base}${path}.${locale.value}.md`
})
const color = computed(() => {
  if (status.value === 'done') {
    return 'white'
  } else if (status.value === 'draft') {
    return 'warning'
  } else {
    return 'red-6'
  }
})
const icon = computed(() => {
  if (status.value === 'done') {
    return 'edit'
  } else if (status.value === 'draft') {
    return 'border_color'
  } else {
    return 'note_add'
  }
})

const progress = computed(() => {
  const i18nPathAbsolute = store.state.i18n.absolute

  if (!i18nPathAbsolute) {
    return '?%'
  }

  const defaultLang = docsectorConfig.defaultLanguage || 'en-US'
  const currentLang = locale.value

  // Count headers (## and ###) in the default language source
  const defaultSourcePath = `_.${i18nPathAbsolute}.source`
  const defaultSource = te(defaultSourcePath, defaultLang) ? tm(defaultSourcePath, defaultLang) : ''

  if (!defaultSource || typeof defaultSource !== 'string') {
    return '?%'
  }

  const headerRegex = /^#{2,6}\s+.+/gm
  const defaultHeaders = (defaultSource.match(headerRegex) || []).length

  if (defaultHeaders === 0) {
    return '100%'
  }

  // If current lang is the default, progress is always 100%
  if (currentLang === defaultLang) {
    return '100%'
  }

  // Count headers in the current language source
  const currentSource = te(defaultSourcePath, currentLang) ? tm(defaultSourcePath, currentLang) : ''

  if (!currentSource || typeof currentSource !== 'string') {
    return '0%'
  }

  const currentHeaders = (currentSource.match(headerRegex) || []).length
  const percent = Math.min(100, Math.floor((currentHeaders / defaultHeaders) * 100))

  return `${percent}%`
})

const languages = computed(() => {
  const i18nPathAbsolute = store.state.i18n.absolute
  const translations = `_.${i18nPathAbsolute}._translations`
  const i18nLocales = availableLocales
  let fallbackLastUpdated = null

  if (te(translations, 'en-US')) {
    fallbackLastUpdated = tm(translations, 'en-US')
  }

  let i18nLocalesAvailable = 0
  if (fallbackLastUpdated) {
    for (let i = 0; i < i18nLocales.length; i++) {
      if (t(translations, i18nLocales[i]) !== fallbackLastUpdated) {
        i18nLocalesAvailable++
      }
    }
  } else {
    i18nLocalesAvailable = 1
  }

  return `${i18nLocalesAvailable}/${i18nLocales.length}`
})

const prev = computed(() => {
  const base = store.state.page.base
  const routes = router.options.routes.slice(0, -2)

  for (let i = 0; i < routes.length; i++) {
    if ('/' + base === routes[i].path) {
      if (i > 0) {
        return routes[i - 1].path
      }
    }
  }

  return ''
})

const next = computed(() => {
  const base = store.state.page.base
  const routes = router.options.routes.slice(0, -2)

  for (let i = 0; i < routes.length; i++) {
    if ('/' + base === routes[i].path) {
      if (typeof routes[i + 1] !== 'undefined') {
        return routes[i + 1].path
      }
    }
  }

  return ''
})
</script>

<template>
<div id="d-page-meta">
  <div class="row justify-between q-mt-lg">
    <div id="d-page-edit" class="col">
      <q-btn dense no-caps text-color="black" :color="color" @click="openURL(URL)" aria-label="Edit page on Github">
        <q-icon class="q-mr-xs" name="fab fa-github" size="20px" />
        <span class="hm" v-if="status === 'done'">{{ $t('page.edit.github.edit') }}</span>
        <span class="hm" v-else-if="status === 'draft'">{{ $t('page.edit.github.complete') }}</span>
        <span class="hm" v-else-if="status === 'empty'">{{ $t('page.edit.github.start') }}</span>
      </q-btn>
    </div>
    <div id="d-page-translation" class="col-auto">
      <q-chip class="languages-progress q-mr-xs q-ml-none" dense square>
        <q-icon class="q-mr-xs" name="translate" size="20px" />
        <span>{{ $i18n.locale }}:<b>{{ ' ' + progress }}</b></span>
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[10, 10]">{{ $t('page.edit.progress') }}</q-tooltip>
      </q-chip>

      <q-chip class="languages-available q-ma-none" dense square>
        <q-icon class="q-mr-xs" name="language" size="20px" />
        <span>{{ '#' + languages }}</span>
        <q-tooltip anchor="top end" self="bottom end" :offset="[10, 10]">{{ $t('page.edit.translations') }}</q-tooltip>
      </q-chip>
    </div>
  </div>

  <nav id="d-page-nav" class="row">
    <router-link class="link col" v-if="prev" :to="`${prev}/overview`">
      <div class="text-caption">{{ $t('page.nav.prev') }}</div>
      <q-icon name="navigate_before" />
      <span>{{ $t(`_${prev.replace(/_$/, '').replace(/\//g, '.')}._`) }}</span>
    </router-link>
    <router-link class="link col" v-if="next" :to="`${next}/overview`">
      <div class="text-caption">{{ $t('page.nav.next') }}</div>
      <span>{{ $t(`_${next.replace(/_$/, '').replace(/\//g, '.')}._`) }}</span>
      <q-icon name="navigate_next" />
    </router-link>
  </nav>
</div>
</template>

<style lang="sass">
#d-page-meta
  max-width: 1200px
  display: block
  width: 100%
  min-height: 36px
  margin: 24px auto 40px auto
  border-top: 3px solid #e0e0e0

  #d-page-translation
    .q-chip
      padding: 16px 0.4em
      margin-top: 0
      margin-bottom: 0

  #d-page-nav
    &:first-child
      margin-top: calc(100vh - 200px)

    .link
      margin-top: 20px
      border: 1px solid #e0e0e0
      padding: 15px !important
</style>
