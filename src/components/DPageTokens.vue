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
import DBlockSourceCode from './DBlockSourceCode.vue'
import DBlockMermaidDiagram from './DBlockMermaidDiagram.vue'
import DBlockBlockquote from './DBlockBlockquote.vue'
import DBlockImage from './DBlockImage.vue'
import DBlockFile from './DBlockFile.vue'
import DBlockEmbeddedUrl from './DBlockEmbeddedUrl.vue'
import DBlockCards from './DBlockCards.vue'
import DBlockQuickLinks from './DBlockQuickLinks.vue'
import DBlockTimeline from './DBlockTimeline.vue'
import DBlockExpandable from './DBlockExpandable.vue'
import DBlockStepper from './DBlockStepper.vue'
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
    v-bind="token.attrs || {}"
    v-html="token.content"
  ></ul>
  <ol
    v-else-if="token.tag === 'ol'"
    v-bind="token.attrs || {}"
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

  <d-block-image
    v-else-if="token.tag === 'image'"
    :content="token.content"
    :caption-html="token.captionHtml"
  />

  <p
    v-else-if="token.tag === 'p'"
    v-html="token.content"
  ></p>

  <d-block-blockquote
    v-else-if="token.tag === 'blockquote'"
    :message="token.alertType"
  >
    <div v-html="token.content"></div>
  </d-block-blockquote>

  <d-block-file
    v-else-if="token.tag === 'file'"
    :src="token.src"
    :title="token.title"
    :size="token.size"
    :caption="token.caption"
  />

  <d-block-embedded-url
    v-else-if="token.tag === 'embedded-url'"
    :url="token.url"
    :title="token.title"
    :caption="token.caption"
  />

  <d-block-source-code
    v-else-if="token.tag === 'code'"
    :index="id + token.codeIndex"
    :text="token.content"
    :language="token.info"
    :filename="token.filename"
    :breadcrumbs="token.breadcrumbs"
    :tabs="token.tabs"
  />

  <d-block-mermaid-diagram
    v-else-if="token.tag === 'mermaid'"
    :content="token.content"
  />

  <d-block-cards
    v-else-if="token.tag === 'cards'"
    :title="token.title"
    :items="token.items"
  />

  <d-block-quick-links
    v-else-if="token.tag === 'quick-links'"
    :title="token.title"
    :items="token.items"
  />

  <d-block-timeline
    v-else-if="token.tag === 'timeline'"
    :items="token.items"
  >
    <template #default="{ item }">
      <d-page-tokens
        :id="id"
        :tokens="item.tokens"
      />
    </template>
  </d-block-timeline>

  <d-block-stepper
    v-else-if="token.tag === 'stepper'"
    :steps="token.steps"
  >
    <template #default="{ step }">
      <d-page-tokens
        :id="id"
        :tokens="step.tokens"
      />
    </template>
  </d-block-stepper>

  <d-block-expandable
    v-else-if="token.tag === 'expandable'"
    :title="token.title"
    :open="token.open"
  >
    <d-page-tokens
      :id="id"
      :tokens="token.tokens"
    />
  </d-block-expandable>
</template>
</template>