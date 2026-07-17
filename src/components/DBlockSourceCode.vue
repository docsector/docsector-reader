<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import Prism from './code-block-highlighting'
import {
  buildSourceCodeLineAnchorId,
  resolveSourceCodeLineHref,
  shouldHandleSourceCodeLineActivation
} from './source-code-anchor'
import { countRenderedCodeLines } from './source-code-lines'
import { looksLikeFileName, resolveFileIconUrl } from '../composables/useFileIcon'
import useNavigator from '../composables/useNavigator'

defineOptions({
  name: 'DBlockSourceCode'
})

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  language: {
    type: String,
    default: 'html'
  },
  text: {
    type: String,
    default: ''
  },
  filename: {
    type: String,
    default: ''
  },
  breadcrumbs: {
    type: Array,
    default: () => []
  },
  // Explicit meta-row override: true/false force it on/off, null keeps the default
  toolbar: {
    type: Boolean,
    default: null
  },
  tabs: {
    type: Array,
    default: () => []
  }
})

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { anchor: scrollToAnchor } = useNavigator()

const copyBtnDisabled = ref(false)
const copyBtnColor = ref(null)
const copyBtnIcon = ref('content_copy')
const codeRef = ref(null)
const activeTab = ref(0)
const lineAnchorTopOffset = 34
const lineAnchorScrollRetryDelay = 500

const coloring = computed(() => $q.dark.isActive ? 'dark' : 'white')
const anchor = computed(() => printToLetter(props.index + 1))

// ? the dark read below is only tracked because every caller is a computed —
//   keep it that way, or these icons stop following live OS theme changes
const fileIconUrl = (label) => {
  if (!looksLikeFileName(label)) {
    return ''
  }

  return resolveFileIconUrl(label, {
    preferLight: !$q.dark.isActive
  })
}

const fallbackCode = computed(() => ({
  label: props.filename || props.language || 'Code',
  language: props.language || 'html',
  text: props.text || '',
  filename: props.filename || '',
  breadcrumbs: props.breadcrumbs || [],
  iconUrl: fileIconUrl(props.filename || props.language || 'Code')
}))
const codeTabs = computed(() => {
  if (!props.tabs.length) {
    return [fallbackCode.value]
  }

  return props.tabs.map((tab, index) => ({
    label: tab.label || tab.filename || tab.language || `Code ${index + 1}`,
    language: tab.language || props.language || 'html',
    text: tab.text || '',
    filename: tab.filename || '',
    breadcrumbs: Array.isArray(tab.breadcrumbs) ? tab.breadcrumbs : [],
    iconUrl: fileIconUrl(tab.label || tab.filename || tab.language || `Code ${index + 1}`)
  }))
})
const hasTabs = computed(() => codeTabs.value.length > 1)
const activeCode = computed(() => codeTabs.value[activeTab.value] || codeTabs.value[0] || fallbackCode.value)
const activeText = computed(() => activeCode.value.text || '')
const activeLanguage = computed(() => activeCode.value.language || 'html')
const activeFilename = computed(() => hasTabs.value ? '' : activeCode.value.filename || '')
const activeBreadcrumbs = computed(() => activeCode.value.breadcrumbs || [])
const activeBreadcrumbItems = computed(() => {
  return activeBreadcrumbs.value.map((segment, index) => ({
    label: segment,
    icon: index === activeBreadcrumbs.value.length - 1 ? fileIconUrl(segment) : ''
  }))
})
const activeBreadcrumbTitle = computed(() => activeBreadcrumbs.value.join(' > '))
const hasBreadcrumbs = computed(() => activeBreadcrumbs.value.length > 0)
const lines = computed(() => countRenderedCodeLines(activeText.value))
const showHeader = computed(() => {
  // ? an explicit :toolbar="true|false"; fence attribute wins over the content-derived default
  if (props.toolbar !== null) {
    return props.toolbar
  }

  return Boolean(hasTabs.value || hasBreadcrumbs.value || lines.value > 1)
})
const codeLanguageClass = computed(() => `language-${activeLanguage.value}`)
const highlighted = computed(() => {
  if (!activeText.value) {
    return ''
  }

  const text = activeText.value.replace(/&#123;/g, '{').replace(/&#125;/g, '}').replace(/&amp;/g, '&')

  const lang = activeLanguage.value || 'markup'
  const grammar = Prism.languages[lang]

  if (!grammar) {
    // Language not loaded — return escaped plain text
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  return Prism.highlight(text, grammar, lang)
})

watch(() => props.tabs, () => {
  activeTab.value = 0
}, { deep: true })

function copyCode() {
  const code = codeRef.value

  if (code) {
    const range = document.createRange()
    range.selectNodeContents(code)

    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    try {
      document.execCommand('copy')

      copyBtnDisabled.value = true
      copyBtnColor.value = 'positive'
      copyBtnIcon.value = 'done'

      setTimeout(() => {
        copyBtnDisabled.value = false
        copyBtnColor.value = null
        copyBtnIcon.value = 'content_copy'
      }, 3000)
    } catch (err) {
      console.error('Error copying text: ', err)
    } finally {
      selection.removeAllRanges()
    }
  }
}

function buildLineAnchorId(line) {
  return buildSourceCodeLineAnchorId(anchor.value, line)
}

function buildLineHref(line) {
  return resolveSourceCodeLineHref(router, route.path, route.query, buildLineAnchorId(line))
}

function scrollToLineAnchor(hash) {
  scrollToAnchor(hash, false)
  window.setTimeout(() => {
    scrollToAnchor(hash, false)
  }, lineAnchorScrollRetryDelay)
}

async function navigateToLineAnchor(event, line) {
  if (!shouldHandleSourceCodeLineActivation(event)) {
    return
  }

  const hash = `#${buildLineAnchorId(line)}`

  event.preventDefault()

  if (route.hash === hash) {
    scrollToLineAnchor(hash)
    return
  }

  window.setTimeout(() => {
    scrollToAnchor(hash, false)
  }, lineAnchorScrollRetryDelay)

  await router.push({
    path: route.path,
    query: route.query,
    hash
  })

  await nextTick()
  scrollToLineAnchor(hash)
}

function printToLetter(number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''

  while (number > 0) {
    const charIndex = (number - 1) % 26
    result = alphabet.charAt(charIndex) + result
    number = Math.floor((number - 1) / 26)
  }

  return result
}
</script>

<template>
<div class="source-code">
  <div class="source-code-frame" :class="[coloring, { 'with-tabs': hasTabs, 'with-breadcrumbs': hasBreadcrumbs }]">
    <div class="source-code-tabs-row" v-if="hasTabs">
      <q-tabs
        v-model="activeTab"
        dense
        align="left"
        class="source-code-tabs"
      >
        <q-tab
          v-for="(tab, index) in codeTabs"
          :key="`${tab.label}-${index}`"
          :name="index"
          no-caps
        >
          <span class="source-code-tab-label">
            <img
              v-if="tab.iconUrl"
              class="source-code-file-icon"
              :src="tab.iconUrl"
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
            <span>{{ tab.label }}</span>
          </span>
        </q-tab>
      </q-tabs>
    </div>

    <div class="source-code-meta-row" v-if="showHeader">
      <q-breadcrumbs
        v-if="hasBreadcrumbs"
        class="source-code-breadcrumbs"
        separator=">"
        :title="activeBreadcrumbTitle"
      >
        <q-breadcrumbs-el
          v-for="(item, index) in activeBreadcrumbItems"
          :key="`${item.label}-${index}`"
          :class="{ 'is-file': item.icon }"
        >
          <span class="source-code-breadcrumb-label">
            <img
              v-if="item.icon"
              class="source-code-file-icon"
              :src="item.icon"
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
            <span>{{ item.label }}</span>
          </span>
        </q-breadcrumbs-el>
      </q-breadcrumbs>

      <div class="info">
        <div class="filename" v-if="activeFilename">{{ activeFilename }}</div>
        <div class="language">{{ activeLanguage }}</div>
        <div class="copy">
          <q-btn
            flat square dense size="xs"
            :disable="copyBtnDisabled"
            :color="copyBtnColor"
            :icon="copyBtnIcon"
            @click="copyCode"
            aria-label="Copy code"
          />
        </div>
      </div>
    </div>

    <div class="code" :class="coloring">
      <div class="lines" v-if="lines && lines > 1">
        <template v-for="(line, index) in lines" :key="index">
          <a class="line" :href="buildLineHref(line)" @click="navigateToLineAnchor($event, line)">
            <q-icon name="link" aria-hidden="true" data-hidden="true" />
            <span :id="buildLineAnchorId(line)" :data-anchor-offset-top="lineAnchorTopOffset">{{ line }}</span>
          </a>
        </template>
      </div>
      <pre>
        <code :class="codeLanguageClass" v-html="highlighted" ref="codeRef"></code>
      </pre>
    </div>
  </div>
</div>
</template>

<style lang="sass">
.source-code
  box-shadow: 0 1px 1px rgb(0 0 0 / 13%)
  max-width: calc(100vw - 40px)
  margin: 14px 0 16px

  .source-code-frame
    border: 1px solid #ddd
    border-bottom-color: #ccc
    border-radius: 3px

    &.white
      background-color: white

      .source-code-meta-row,
      .info .filename,
      .info .language,
      .info .copy
        background-color: #fff

      // ? 4.5:1 on white (base gray is 3.9:1)
      .info .language
        color: #666

      .source-code-meta-row
        box-shadow: 0 2px 4px rgb(0 0 0 / 8%)

      .source-code-tabs-row
        background-color: #f6f6f6

      .source-code-tabs
        background-color: transparent

        .q-tab
          background-color: #e9e9e9
          color: #555

        .q-tab.q-tab--active
          background-color: white
          color: #222

    &.dark
      background-color: #000

      .source-code-meta-row,
      .info .filename,
      .info .language,
      .info .copy
        background-color: #000

      // ? 4.5:1 on black
      .info .language
        color: #949494

      .source-code-meta-row
        box-shadow: 0 3px 10px rgb(255 255 255 / 24%)

      .source-code-tabs-row
        background-color: #242424

      .source-code-tabs
        background-color: transparent

        .q-tab
          background-color: #333
          border-right-color: #444
          color: #d6d6d6

        .q-tab.q-tab--active
          background-color: #000
          color: white

  .source-code-tabs-row
    min-width: 0
    overflow-x: auto
    width: 100%

  .source-code-meta-row
    align-items: center
    display: flex
    min-height: 26px
    min-width: 0
    position: sticky
    top: 0
    width: 100%
    z-index: 2

  .source-code-tabs
    color: gray
    flex: 0 1 auto
    min-width: 0
    overflow-x: auto
    width: fit-content

    .q-tab
      border-right: 1px solid #ddd
      min-height: 22px
      padding: 0 10px

      &:last-child
        border-right: 0

    .q-tab__content
      min-width: 0

    .source-code-tab-label
      align-items: center
      display: inline-flex
      gap: 6px
      min-width: 0

      span
        overflow: hidden
        text-overflow: ellipsis
        white-space: nowrap

    .q-tab__label
      font-size: 13px
      overflow: hidden
      text-overflow: ellipsis
      white-space: nowrap

    .q-tab__indicator
      display: none

  .source-code-breadcrumbs
    align-items: center
    color: gray
    flex: 1 1 auto
    flex-wrap: nowrap
    font-size: 13px
    height: 26px
    line-height: 16px
    margin: 0
    min-width: 0
    overflow: hidden
    padding: 0 6px

    > .flex
      align-items: center
      display: flex
      flex-wrap: nowrap
      height: 100%
      margin: 0
      min-width: 0
      overflow: hidden
      width: 100%

      > *
        margin-left: 0 !important
        margin-top: 0 !important

    .q-breadcrumbs__el,
    .q-breadcrumbs__separator
      color: gray
      overflow: hidden
      text-overflow: ellipsis
      white-space: nowrap

    .q-breadcrumbs__el
      align-items: center
      display: inline-flex
      flex: 0 1 auto
      max-width: 150px
      min-width: 0

      &.is-file
        flex: 1 1 auto
        max-width: 220px

    .q-breadcrumbs__separator
      align-items: center
      align-self: center
      display: inline-flex
      flex: 0 0 auto
      font-size: 17px
      height: 16px
      justify-content: center
      line-height: 16px
      margin: 0 4px 0 4px
      margin-left: 4px !important
      overflow: visible
      padding: 0

    .source-code-breadcrumb-label
      align-items: center
      display: inline-flex
      gap: 6px
      line-height: 16px
      max-width: 100%
      min-width: 0

      span
        display: inline-block
        overflow: hidden
        text-overflow: ellipsis
        white-space: nowrap

  .source-code-file-icon
    flex: 0 0 auto
    height: 16px
    object-fit: contain
    width: 16px

  .info
    display: flex
    height: 26px
    margin-left: auto
    flex-shrink: 0

    .copy
      color: gray
      padding: 0
      user-select: none

      button
        padding: 7px 8px 6px
        position: relative

    .filename
      font-size: 13px
      color: gray
      max-width: 220px
      overflow: hidden
      padding: 3px 6px 0
      text-overflow: ellipsis
      user-select: none
      white-space: nowrap

    .language
      font-size: 13px
      color: gray
      padding: 3px 5px 0
      user-select: none

  @media (max-width: 600px)
    .source-code-tabs,
    .source-code-breadcrumbs
      max-width: 100%

  .code
    font-family: "Fira Code Nerd Font", "Consolas" !important
    position: relative
    border: 0
    border-radius: 0
    margin: 0
    padding: 0

    .lines
      padding: 10px 5px 10px 5px
      text-align: right
      float: left
      -webkit-user-select: none
      user-select: none
      line-height: 19px

      a
        display: block
        font-size: 90% !important
        min-height: 19px
        white-space: nowrap
        padding: 0 3px

        &:hover
          i
            visibility: visible

        i
          font-size: 10px
          float: left
          margin-top: 4px
          margin-right: 4px
          visibility: hidden

    pre
      font-family: "Fira Code Nerd Font", "Consolas" !important
      display: flex
      margin: 0
      border: 0
      padding: 10px
      white-space: pre
      line-height: 19px
      word-wrap: normal
      overflow: auto
      overflow-y: hidden

      > code
        font-family: "Fira Code Nerd Font", "Consolas" !important
        display: block
        padding: 0

    &.white
      .language
        background-color: white
      .lines
        background-color: #fafafa
        a
          border-color: #f0f0f0
          color: #565555 !important
        a:hover
          border-color: #f0f0f0
          color: #565555 !important

      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata
        color: #4e5a65

      .token.punctuation
        color: #999

      .token.namespace
        opacity: .7

      .token.property,
      .token.tag,
      .token.boolean,
      .token.number,
      .token.constant,
      .token.class-name,
      .token.symbol,
      .token.deleted
        color: #905

      .token.selector,
      .token.attr-name,
      .token.string,
      .token.char,
      .token.builtin,
      .token.inserted
        color: #416200

      .token.operator,
      .token.entity,
      .token.url,
      .language-css .token.string,
      .style .token.string
        color: #9a6e3a

      .token.atrule,
      .token.attr-value,
      .token.keyword
        color: #07a

      .token.function
        color: #9a3449

      .token.regex,
      .token.important,
      .token.variable
        color: #7b4f00

      .token.important,
      .token.bold
        font-weight: bold
      .token.italic
        font-style: italic

      .token.entity
        cursor: help

    &.dark
      .language
        background-color: #000
      .lines
        background-color: #000
        a
          border-color: #f0f0f0
          color: #969696 !important
        a:hover
          border-color: #f0f0f0
          background-color: transparent !important

      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata
        color: #A0A1A7cc

      .token.punctuation
        color: #D5CED9

      .token.namespace
        opacity: .7

      .token.property
        color: #7CB7FF
      .token.constant.boolean
        color: #f39c12
      .token.number
        color: #f39c12

      .token.class-name
        color: #ff68bc
      .token.constant
        color: #ff68bc
      .token.tag,
      .token.symbol,
      .token.deleted
        color: #FF66BA

      .token.selector,
      .token.attr-name,
      .token.string,
      .token.char,
      .token.builtin,
      .token.inserted
        color: #96E072

      .token.operator,
      .token.entity,
      .token.url,
      .language-css .token.string,
      .style .token.string
        color: #9a6e3a

      .token.atrule,
      .token.attr-value,
      .token.keyword
        color: #c74ded

      .token.function
        color: #FFE66D

      .token.regex,
      .token.important,
      .token.variable
        color: #7CB7FF

      .token.important,
      .token.bold
        font-weight: bold
      .token.italic
        font-style: italic

      .token.entity
        cursor: help
</style>
