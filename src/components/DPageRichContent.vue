<script>
import { defineComponent, h, onMounted, onUpdated, ref } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import {
  decorateInlineCodeCopyTargets,
  getInlineCodeCopyTarget
} from './inline-code-copy'

export default defineComponent({
  name: 'DPageRichContent',

  props: {
    tag: {
      type: String,
      default: 'div'
    },
    html: {
      type: String,
      default: ''
    },
    attrs: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const rootRef = ref(null)
    const $q = useQuasar()
    const { t } = useI18n()

    const syncInlineCodeTargets = () => {
      decorateInlineCodeCopyTargets(rootRef.value, t('page.copyInlineCode'))
    }

    const notifyCopied = () => {
      $q.notify({
        message: t('page.copied'),
        color: 'positive',
        textColor: 'white',
        icon: 'check',
        position: 'top',
        timeout: 1200
      })
    }

    const copyInlineCode = (element) => {
      const text = String(element?.textContent || '').trim()
      if (!text) return

      copyToClipboard(text)
        .then(notifyCopied)
        .catch(() => {})
    }

    const handleInlineCodeClick = (event) => {
      const code = getInlineCodeCopyTarget(event.target, rootRef.value)
      if (!code) return

      event.preventDefault()
      copyInlineCode(code)
    }

    const handleInlineCodeKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      const code = getInlineCodeCopyTarget(event.target, rootRef.value)
      if (!code) return

      event.preventDefault()
      copyInlineCode(code)
    }

    onMounted(syncInlineCodeTargets)
    onUpdated(syncInlineCodeTargets)

    return () => h(props.tag, {
      ...(props.attrs || {}),
      ref: rootRef,
      class: ['d-page-rich-content', props.attrs?.class],
      innerHTML: props.html,
      onClick: handleInlineCodeClick,
      onKeydown: handleInlineCodeKeydown
    })
  }
})
</script>

<style scoped lang="sass">
.d-page-rich-content
  :deep(.d-copyable-inline-code)
    cursor: copy
    transition: background-color 0.15s ease, outline-color 0.15s ease

    &:hover
      background-color: rgba(25, 118, 210, 0.14)

    &:focus-visible
      outline: 2px solid currentColor
      outline-offset: 2px
</style>
