<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { copyToClipboard, useQuasar } from 'quasar'

import docsectorConfig from 'docsector.config.js'
import gitDates from 'virtual:docsector-git-dates'

const $q = useQuasar()
const store = useStore()
const route = useRoute()
const { t, locale } = useI18n()

const copied = ref(false)

const OPENAI_PATH = 'M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z'
const CLAUDE_PATH = 'M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z'

function buildIconURI (paths, fillRule) {
  const fill = $q.dark.isActive ? '#ccc' : '#555'
  const fr = fillRule ? ` fill-rule="${fillRule}"` : ''
  const pathArr = Array.isArray(paths) ? paths : [paths]
  const pathEls = pathArr.map(d => `<path d="${d}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="${fill}"${fr} viewBox="0 0 24 24">${pathEls}</svg>`
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
  if (store.state.page.base === 'home') {
    const homePage = docsectorConfig.homePage || {}
    const isRemoteHome = homePage.source === 'remote-readme' && typeof homePage.remoteReadmeUrl === 'string' && homePage.remoteReadmeUrl.length > 0

    if (isRemoteHome) {
      return homePage.remoteReadmeUrl
    }

    return `/Homepage.${locale.value}.md`
  }

  const path = route.path.replace(/\/+$/, '')
  return `${path}.md`
})

const fullMarkdownURL = computed(() => {
  if (store.state.page.base === 'home') {
    return `${window.location.origin}/Homepage.${locale.value}.md`
  }

  const path = route.path.replace(/\/+$/, '')
  return `${window.location.origin}${path}.md`
})

const chatSourceURL = computed(() => {
  if (store.state.page.base !== 'home') {
    return fullMarkdownURL.value
  }

  const homePage = docsectorConfig.homePage || {}
  const isRemoteHome = homePage.source === 'remote-readme' && typeof homePage.remoteReadmeUrl === 'string' && homePage.remoteReadmeUrl.length > 0

  if (isRemoteHome) {
    return `${window.location.origin}/`
  }

  return fullMarkdownURL.value
})

const chatgptURL = computed(() => {
  const prompt = `Read ${chatSourceURL.value} and answer questions about the content.`
  return `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`
})
const claudeURL = computed(() => {
  const prompt = `Read ${chatSourceURL.value} and answer questions about the content.`
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
})

const MCP_PATHS = [
  'M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z',
  'M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z'
]
const VSCODE_PATH = 'M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z'
const mcpIcon = computed(() => buildIconURI(MCP_PATHS, 'evenodd'))

function buildVSCodeIconURI (color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" clip-rule="evenodd" d="${VSCODE_PATH}" fill="%23${color}"/></svg>`
  return `img:data:image/svg+xml,${svg}`
}
const vscodeIcon = computed(() => buildVSCodeIconURI('007ACC'))
const vscodeInsidersIcon = computed(() => buildVSCodeIconURI('24bfa5'))
const codexIcon = computed(() => buildIconURI(OPENAI_PATH))

const mcpURL = computed(() => {
  if (!docsectorConfig.mcp) return null
  return `${window.location.origin}/mcp`
})

const vscodeMcpURL = computed(() => {
  if (!docsectorConfig.mcp) return null
  const name = docsectorConfig.mcp.serverName
  const url = `${window.location.origin}/mcp`
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name, url }))}`
})

const vscodeInsidersMcpURL = computed(() => {
  if (!docsectorConfig.mcp) return null
  const name = docsectorConfig.mcp.serverName
  const url = `${window.location.origin}/mcp`
  return `vscode-insiders:mcp/install?${encodeURIComponent(JSON.stringify({ name, url }))}`
})

const claudeCodeCommand = computed(() => {
  if (!docsectorConfig.mcp) return null
  const name = docsectorConfig.mcp.serverName
  const url = `${window.location.origin}/mcp`
  return `claude mcp add ${name} --scope user --transport http ${url}`
})

const codexCommand = computed(() => {
  if (!docsectorConfig.mcp) return null
  const name = docsectorConfig.mcp.serverName
  const url = `${window.location.origin}/mcp`
  return `codex mcp add ${name} --url ${url}`
})

const copiedMcp = ref(null)
const copyMcpCommand = (command, type) => {
  copyToClipboard(command).then(() => {
    copiedMcp.value = type
    setTimeout(() => { copiedMcp.value = null }, 2000)
  })
}

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

      <template v-if="mcpURL">
        <q-separator />

        <q-item clickable v-close-popup :href="mcpURL" target="_blank" class="q-py-sm">
          <q-item-section avatar>
            <q-icon :name="mcpIcon" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('page.mcpServer') }}</q-item-label>
            <q-item-label caption>{{ t('page.mcpServerCaption') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" size="xs" />
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup :href="vscodeMcpURL" class="q-py-sm">
          <q-item-section avatar>
            <q-icon :name="vscodeIcon" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('page.connectVSCode') }}</q-item-label>
            <q-item-label caption>{{ t('page.connectVSCodeCaption') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" size="xs" />
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup :href="vscodeInsidersMcpURL" class="q-py-sm">
          <q-item-section avatar>
            <q-icon :name="vscodeInsidersIcon" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('page.connectVSCodeInsiders') }}</q-item-label>
            <q-item-label caption>{{ t('page.connectVSCodeInsidersCaption') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" size="xs" />
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="copyMcpCommand(claudeCodeCommand, 'claude')" class="q-py-sm">
          <q-item-section avatar>
            <q-icon :name="claudeIcon" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ copiedMcp === 'claude' ? t('page.copied') : t('page.connectClaudeCode') }}</q-item-label>
            <q-item-label caption>{{ t('page.connectClaudeCodeCaption') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon :name="copiedMcp === 'claude' ? 'check' : 'content_copy'" size="xs" />
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="copyMcpCommand(codexCommand, 'codex')" class="q-py-sm">
          <q-item-section avatar>
            <q-icon :name="codexIcon" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ copiedMcp === 'codex' ? t('page.copied') : t('page.connectCodex') }}</q-item-label>
            <q-item-label caption>{{ t('page.connectCodexCaption') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon :name="copiedMcp === 'codex' ? 'check' : 'content_copy'" size="xs" />
          </q-item-section>
        </q-item>
      </template>
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
