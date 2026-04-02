<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { copyToClipboard, openURL } from 'quasar'

import gitDates from 'virtual:docsector-git-dates'

const store = useStore()
const route = useRoute()
const { t, locale } = useI18n()

const copied = ref(false)

const subpage = computed(() => {
  const rel = store.state.page.relative
  return rel ? rel.replace(/^\//, '') : 'overview'
})

const fileKey = computed(() => {
  const base = store.state.page.base
  if (!base) return ''
  return `${base}.${subpage.value}.${locale.value}.md`
})

const formattedDate = computed(() => {
  const iso = gitDates[fileKey.value]
  if (!iso) return ''

  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
})

const rawMarkdown = computed(() => {
  const absolute = store.state.i18n.absolute
  if (!absolute) return ''

  const source = t(`_.${absolute}.source`)
  if (!source) return ''

  return String(source)
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/\{'([^']+)'\}/g, '$1')
    .replace(/&amp;/g, '&')
})

const markdownURL = computed(() => {
  return `${route.path}.md`
})

const copyPage = () => {
  if (!rawMarkdown.value) return

  copyToClipboard(rawMarkdown.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

const viewAsMarkdown = () => {
  openURL(markdownURL.value)
}
</script>

<template>
<div class="d-page-bar">
  <span v-if="formattedDate" class="d-page-bar__date">
    {{ t('page.lastUpdated') }}: {{ formattedDate }}
  </span>
  <span v-else class="d-page-bar__date"></span>

  <q-btn-dropdown
    class="d-page-bar__actions"
    split
    no-caps
    :icon="copied ? 'check' : 'content_copy'"
    :label="copied ? t('page.copied') : t('page.copyPage')"
    :color="copied ? 'positive' : 'grey-7'"
    size="sm"
    @click="copyPage"
  >
    <q-list style="min-width: 240px">
      <q-item clickable v-close-popup @click="copyPage" class="q-py-sm">
        <q-item-section avatar>
          <q-icon name="content_copy" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t('page.copyPage') }}</q-item-label>
          <q-item-label caption>{{ t('page.copyPageCaption') }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable v-close-popup @click="viewAsMarkdown" class="q-py-sm">
        <q-item-section avatar>
          <q-icon name="description" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t('page.viewAsMarkdown') }}</q-item-label>
          <q-item-label caption>{{ t('page.viewAsMarkdownCaption') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" size="xs" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</div>
</template>

<style lang="sass">
.d-page-bar
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 4px

  &__date
    font-size: 0.8rem
    opacity: 0.6

  &__actions
    font-size: 0.75rem

body.body--dark
  .d-page-bar__date
    color: rgba(255, 255, 255, 0.7)
</style>
