<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { copyToClipboard, useQuasar } from 'quasar'

import gitDates from 'virtual:docsector-git-dates'

const $q = useQuasar()
const store = useStore()
const route = useRoute()
const { t, locale } = useI18n()

const copied = ref(false)

const OPENAI_PATH = 'M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z'
const CLAUDE_PATH = 'M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z'

function buildIconURI (path, fillRule) {
  const fill = $q.dark.isActive ? '#ccc' : '#555'
  const fr = fillRule ? ` fill-rule="${fillRule}"` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="${fill}"${fr} viewBox="0 0 24 24"><path d="${path}"/></svg>`
  return `img:data:image/svg+xml,${encodeURIComponent(svg)}`
}

const openaiIcon = computed(() => buildIconURI(OPENAI_PATH))
const claudeIcon = computed(() => buildIconURI(CLAUDE_PATH, 'evenodd'))

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
  const path = route.path.replace(/\/+$/, '')
  return `${path}.md`
})

const fullMarkdownURL = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return `${window.location.origin}${path}.md`
})

const chatgptURL = computed(() => {
  const prompt = `Read ${fullMarkdownURL.value} and answer questions about the content.`
  return `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`
})
const claudeURL = computed(() => {
  const prompt = `Read ${fullMarkdownURL.value} and answer questions about the content.`
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
})

const copyPage = () => {
  if (!rawMarkdown.value) return

  copyToClipboard(rawMarkdown.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<template>
<div class="d-page-bar">
  <span v-if="formattedDate" class="d-page-bar__date">
    {{ t('page.lastUpdated') }}: <br class="d-page-bar__date-break"> {{ formattedDate }}
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

      <q-item clickable v-close-popup :href="markdownURL" target="_blank" class="q-py-sm">
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

      <q-separator />

      <q-item clickable v-close-popup :href="chatgptURL" target="_blank" class="q-py-sm">
        <q-item-section avatar>
          <q-icon :name="openaiIcon" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t('page.openInChatGPT') }}</q-item-label>
          <q-item-label caption>{{ t('page.openInChatGPTCaption') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" size="xs" />
        </q-item-section>
      </q-item>

      <q-item clickable v-close-popup :href="claudeURL" target="_blank" class="q-py-sm">
        <q-item-section avatar>
          <q-icon :name="claudeIcon" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t('page.openInClaude') }}</q-item-label>
          <q-item-label caption>{{ t('page.openInClaudeCaption') }}</q-item-label>
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

  &__date-break
    display: none

  &__actions
    font-size: 0.75rem

body.body--dark
  .d-page-bar__date
    color: rgba(255, 255, 255, 0.7)

@media (max-width: 376px)
  .d-page-bar__date-break
    display: block
</style>
