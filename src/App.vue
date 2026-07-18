<template>
<router-view />

<d-update-banner />

<q-dialog id="settings" v-model="toogleDialog" :maximized="$q.platform.is.mobile ? true : false">
  <q-layout
    view="Lhh lpR fff"
    container
    :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'"
    :style="$q.platform.is.mobile ? '' : 'max-height: 450px'"
  >
    <q-header class="d-header" elevated>
      <q-toolbar class="q-pr-none">
        <q-icon name="settings" style="font-size: 1.5rem" />
        <q-toolbar-title>{{ $t('menu.settings') }}</q-toolbar-title>
        <q-btn class="filled" v-close-popup text-color="white" icon="close" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label header>{{ $t('settings.general._') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item dense>
            <q-item-section avatar>
              <q-icon name="language" class="q-pl-sm" />
            </q-item-section>
            <q-item-section>
              <q-select
                v-model="settings.general.language.default" :options="settings.general.language.options"
                stack-label dense outlined
                emit-value map-options
                :label="$t('settings.general.language._')"
                options-selected-class="bg-primary text-white"
                behavior="menu"
                @update:model-value="setLanguage"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-img no-spinner :src="scope.opt.image" width="24px" height="24px" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:selected-item="scope">
                  <q-item @remove="scope.removeAtIndex(scope.index)" :tabindex="scope.tabindex">
                    <q-item-section avatar>
                      <q-img no-spinner :src="scope.opt.image" width="24px" height="24px" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item>
            <q-item-section>
              <q-item-label header>{{ $t('settings.appearance._') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item dense>
            <q-item-section avatar>
              <q-icon name="format_color_fill" class="q-pl-sm" />
            </q-item-section>
            <q-item-section>
              <q-select
                v-model="theme" :options="themeOptions"
                stack-label dense outlined
                emit-value map-options
                :label="$t('settings.appearance.theme._')"
                behavior="menu"
                options-selected-class="bg-primary text-white"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt.icon" />
                    </q-item-section>
                    <q-item-section class="text-weight-bold">
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:selected-item="scope">
                  <q-item @remove="scope.removeAtIndex(scope.index)" :tabindex="scope.tabindex">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt.icon" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </q-item-section>
          </q-item>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</q-dialog>
</template>

<script>
// Module scope — runs before app.use(Quasar), which is the whole point.
// See theme-init.js: it must beat the Dark plugin's install to the theme.
import './theme-init.js'
</script>

<script setup>
import { reactive, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { Dark, useQuasar } from 'quasar'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'

import docsectorConfig from 'docsector.config.js'
import DUpdateBanner from './components/DUpdateBanner.vue'
import { setupUpdateCheck } from './composables/useUpdateCheck'
import { loadPersistedAssistantLayout } from './store/Layout'
import { setupWebMcp } from './composables/useWebMcp'
import { fromDarkValue, persistTheme, toDarkValue } from './theme.js'

defineOptions({ name: 'App' })

const $q = useQuasar()
const store = useStore()
const { locale, t } = useI18n()
const router = useRouter()
const route = useRoute()

let cleanupWebMcp = null
let cleanupUpdateCheck = null

const settings = reactive({
  general: {
    language: {
      default: $q.localStorage.getItem('setting.language'),
      options: docsectorConfig.languages || [
        {
          image: '/images/flags/united-states-of-america.png',
          label: 'English (US)',
          value: 'en-US'
        },
        {
          image: '/images/flags/brazil.png',
          label: 'Português (BR)',
          value: 'pt-BR'
        }
      ]
    }
  }
})

// Appearance — $q.dark.mode is the reactive source of truth (it keeps the
// literal 'auto'), so there is no local copy to drift out of sync when the OS
// theme flips on its own.
const theme = computed({
  get () {
    return fromDarkValue($q.dark.mode)
  },
  set (value) {
    setTheme(value)
  }
})

// A computed, not a reactive() literal: option labels must re-translate when
// the reader switches language.
const themeOptions = computed(() => [
  {
    icon: 'brightness_auto',
    label: t('settings.appearance.theme.auto'),
    value: 'auto'
  },
  {
    icon: 'light_mode',
    label: t('settings.appearance.theme.light'),
    value: 'light'
  },
  {
    icon: 'dark_mode',
    label: t('settings.appearance.theme.dark'),
    value: 'dark'
  }
])

const toogleDialog = computed({
  get () {
    return store.getters['settings/dialog']
  },
  set (value) {
    store.commit('settings/dialog', value)
  }
})

// Language
function setLanguage (language) {
  $q.localStorage.set('setting.language', language)

  store.commit('page/resetAnchors')
  store.commit('page/resetNodes')

  locale.value = language

  router.go()
}

// Appearance
function setTheme (value) {
  const applied = persistTheme(value, { storage: window.localStorage })

  // : live mutation — unlike setLanguage, no reload is needed
  Dark.set(toDarkValue(applied))
}

// ? Hand the pre-hydration drawer-column reservation (see app.sass) over to
//   QLayout: once Quasar's Screen has measured, the layout owns the real
//   inline paddings — the CSS fallback can go without any visual change.
let hydratedMarked = false
watch(() => $q.screen.width, (width) => {
  if (hydratedMarked || width === 0 || typeof document === 'undefined') {
    return
  }

  hydratedMarked = true
  nextTick(() => {
    document.body.classList.add('docsector-hydrated')
  })
}, { immediate: true })

onMounted(() => {
  // ? Persisted assistant drawer state applies only after mount: the store
  //   must boot with server-parity values (SSR has no localStorage) or the
  //   hydration mismatches and opens an empty assistant drawer.
  if (loadPersistedAssistantLayout()) {
    store.commit('layout/setAssistant', true)
  }

  const defaultLang = docsectorConfig.defaultLanguage || 'en-US'

  // Language
  let loc = $q.localStorage.getItem('setting.language')
  if (loc === null) {
    loc = defaultLang
    $q.localStorage.set('setting.language', loc)
    settings.general.language.default = loc
  }
  locale.value = loc

  // ? the theme is applied by theme-init.js, before Quasar's Dark plugin
  //   installs — doing it here would clobber it after the first paint

  cleanupWebMcp = setupWebMcp({
    router,
    route,
    store,
    translate: t,
    locale
  })

  cleanupUpdateCheck = setupUpdateCheck()
})

onBeforeUnmount(() => {
  if (typeof cleanupWebMcp === 'function') {
    cleanupWebMcp()
    cleanupWebMcp = null
  }

  if (typeof cleanupUpdateCheck === 'function') {
    cleanupUpdateCheck()
    cleanupUpdateCheck = null
  }
})
</script>

<style lang="sass">
#settings
  .q-select
    .q-field__append, .q-field--dense .q-field__marginal
      height: 63px !important
    .q-item
      padding: 8px 0
      .q-item__section--side
        padding-right: 12px
      .q-item__section--avatar
        min-width: 24px
.q-menu
  .q-item__section--side
    padding-right: 12px
  .q-item__section--avatar
    min-width: 24px
</style>
