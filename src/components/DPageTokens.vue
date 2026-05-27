<script setup>
defineOptions({
  name: 'DPageTokens'
})

defineProps({
  id: {
    type: Number,
    default: 0
  },
  tokens: {
    type: Array,
    default: () => []
  }
})

import DH2 from './DH2.vue'
import DH3 from './DH3.vue'
import DH4 from './DH4.vue'
import DH5 from './DH5.vue'
import DH6 from './DH6.vue'
import DPageSourceCode from './DPageSourceCode.vue'
import DMermaidDiagram from './DMermaidDiagram.vue'
import DPageBlockquote from './DPageBlockquote.vue'
import DQuickLinks from './DQuickLinks.vue'
import DPageExpandable from './DPageExpandable.vue'
</script>

<template>
<template v-for="(token, index) in tokens" :key="`${token.tag}-${index}`">
  <d-h2
    v-if="token.tag === 'h2'"
    :id="token.anchorId"
    :value="token.content"
  />
  <d-h3
    v-else-if="token.tag === 'h3'"
    :id="token.anchorId"
    :value="token.content"
  />
  <d-h4
    v-else-if="token.tag === 'h4'"
    :id="token.anchorId"
    :value="token.content"
  />
  <d-h5
    v-else-if="token.tag === 'h5'"
    :id="token.anchorId"
    :value="token.content"
  />
  <d-h6
    v-else-if="token.tag === 'h6'"
    :id="token.anchorId"
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

  <div
    v-else-if="token.tag === 'table'"
    class="d-table-wrapper"
  >
    <table v-html="token.content"></table>
  </div>

  <div
    v-else-if="token.tag === 'html'"
    v-html="token.content"
  ></div>

  <p
    v-else-if="token.tag === 'p'"
    v-html="token.content"
  ></p>

  <d-page-blockquote
    v-else-if="token.tag === 'blockquote'"
    :message="token.alertType"
  >
    <div v-html="token.content"></div>
  </d-page-blockquote>

  <d-page-source-code
    v-else-if="token.tag === 'code'"
    :index="id + token.codeIndex"
    :text="token.content"
    :language="token.info"
    :filename="token.filename"
    :breadcrumbs="token.breadcrumbs"
    :tabs="token.tabs"
  />

  <d-mermaid-diagram
    v-else-if="token.tag === 'mermaid'"
    :content="token.content"
  />

  <d-quick-links
    v-else-if="token.tag === 'quick-links'"
    :title="token.title"
    :items="token.items"
  />

  <d-page-expandable
    v-else-if="token.tag === 'expandable'"
    :title="token.title"
    :open="token.open"
  >
    <d-page-tokens
      :id="id"
      :tokens="token.tokens"
    />
  </d-page-expandable>
</template>
</template>