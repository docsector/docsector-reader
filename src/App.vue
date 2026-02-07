<template>
<router-view />

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
                v-model="settings.appearance.background.default" :options="settings.appearance.background.options"
                stack-label dense outlined
                emit-value map-options
                :label="$t('settings.appearance.background._')"
                behavior="menu"
                options-selected-class="bg-primary text-white"
                @update:model-value="setBackground"
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

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import docsectorConfig from 'docsector.config.js'

defineOptions({ name: 'App' })

const $q = useQuasar()
const store = useStore()
const { locale } = useI18n()
const router = useRouter()

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
  },
  appearance: {
    background: {
      default: $q.localStorage.getItem('setting.background'),
      options: [
        {
          icon: 'light_mode',
          label: 'Modo Claro',
          value: false
        },
        {
          icon: 'dark_mode',
          label: 'Modo Escuro',
          value: true
        }
      ]
    }
  }
})

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

// Background
function setBackground (mode) {
  $q.localStorage.set('setting.background', mode)
  $q.dark.set(mode)
}

onMounted(() => {
  const defaultLang = docsectorConfig.defaultLanguage || 'en-US'

  // Language
  let loc = $q.localStorage.getItem('setting.language')
  if (loc === null) {
    loc = defaultLang
    $q.localStorage.set('setting.language', loc)
    settings.general.language.default = loc
  }
  locale.value = loc

  // Background
  let dark = $q.localStorage.getItem('setting.background')
  if (dark === null) {
    dark = false
    $q.localStorage.set('setting.background', dark)
    settings.appearance.background.default = dark
  }
  $q.dark.set(dark)
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
