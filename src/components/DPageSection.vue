<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { useI18n } from "vue-i18n"

import DH2 from './DH2.vue'
import DH3 from './DH3.vue'
import DH4 from './DH4.vue'
import DH5 from './DH5.vue'
import DH6 from './DH6.vue'
import DPageSourceCode from './DPageSourceCode.vue'

const props = defineProps({
  id: {
    type: Number,
    required: true
  }
})

const store = useStore()
const { t } = useI18n()

const tokenized = computed(() => {
  const absolute = store.state.i18n.absolute

  if (!absolute) {
    return []
  }

  const source = t(`_.${absolute}.source`)

  const Markdown = new MarkdownIt()
  Markdown.use(attrs, {
    leftDelimiter: ':',
    rightDelimiter: ';',
    allowedAttributes: ['filename']
  })

  const parsed = Markdown.parse(source)

  // @ map
  const tokens = []
  let level = 0
  let tag = ''
  const children = []
  parsed.forEach((element) => {
    switch (element.type) {
      case 'bullet_list_open':
      case 'ordered_list_open':
      case 'table_open':
        level++
    }

    // Render
    if (element.type === 'inline') {
      element.content = Markdown.renderInline(element.content)
    }

    if (level === 0) {
      // Prepare
      switch (element.type) {
        case 'heading_open':
        case 'paragraph_open':
        case 'list_item_open':
          tag = element.tag
      }

      // Push
      switch (element.type) {
        case 'inline':
          tokens.push({
            tag,
            map: element.map,
            content: element.content,
            info: element.info,
            children
          })

          break
        case 'fence': {
          const info = element.info.split(' ')
          const language = info[0]
          const filename = info[1] ? info[1].replace('filename=', '').replace(/"/g, '') : ''

          tokens.push({
            tag: element.tag,
            content: element.content,
            info: language,
            filename: filename
          })
          break
        }
      }
    } else if (level === 1) {
      const parent = tokens[tokens.length - 1]

      switch (element.type) {
        case 'bullet_list_open':
          tokens.push({
            tag: 'ul',
            content: ''
          })
          break
        case 'ordered_list_open':
          tokens.push({
            tag: 'ol',
            content: ''
          })
          break
        case 'table_open':
          tokens.push({
            tag: 'table',
            content: ''
          })
          break

        case 'list_item_open':
          parent.content += '<li>'
          break

        case 'thead_open':
          parent.content += '<thead>'
          break
        case 'tbody_open':
          parent.content += '<tbody>'
          break
        case 'tr_open':
          parent.content += '<tr>'
          break
        case 'th_open':
          parent.content += '<th>'
          break
        case 'td_open':
          parent.content += '<td>'
          break

        case 'inline':
          parent.content += element.content
          break

        case 'list_item_close':
          parent.content += '</li>'
          break

        case 'thead_close':
          parent.content += '</thead>'
          break
        case 'tbody_close':
          parent.content += '</tbody>'
          break
        case 'tr_close':
          parent.content += '</tr>'
          break
        case 'th_close':
          parent.content += '</th>'
          break
        case 'td_close':
          parent.content += '</td>'
          break
      }
    }

    switch (element.type) {
      case 'bullet_list_close':
      case 'ordered_list_close':
      case 'table_close':
        level--
    }
  })

  return tokens
})
</script>

<template>
<section>
  <template v-for="(token, index) in tokenized" :key="index">
    <d-h2
      v-if="token.tag === 'h2'"
      :id="id + token.map[0]"
      :value="token.content"
    />
    <d-h3
      v-else-if="token.tag === 'h3'"
      :id="id + token.map[0]"
      :value="token.content"
    />
    <d-h4
      v-else-if="token.tag === 'h4'"
      :id="id + token.map[0]"
      :value="token.content"
    />
    <d-h5
      v-else-if="token.tag === 'h5'"
      :id="id + token.map[0]"
      :value="token.content"
    />
    <d-h6
      v-else-if="token.tag === 'h6'"
      :id="id + token.map[0]"
      :value="token.content"
    />

    <ul
      v-else-if="token.tag === 'ul'"
      v-html="token.content"
    ></ul>
    <ol
      v-else-if="token.tag === 'ol'"
      v-html="token.content"
    ></ol>

    <table
      v-else-if="token.tag === 'table'"
      v-html="token.content"
    ></table>

    <p
      v-else-if="token.tag === 'p'"
      v-html="token.content"
    ></p>

    <d-page-source-code
      v-else-if="token.tag === 'code'"
      :index="id + index"
      :text="token.content"
      :language="token.info"
      :filename="token.filename"
    />
  </template>
</section>
</template>

<style lang="sass">
.content
  p
    line-height: 1.6em

    &.overview
      word-spacing: 0.05em
</style>
