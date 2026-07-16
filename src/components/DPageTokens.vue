<script setup>
defineOptions({
  name: 'DPageTokens'
})

defineProps({
  id: {
    type: Number,
    default: 0
  },
  renderPrimaryHeading: {
    type: Boolean,
    default: false
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
import DPageRichContent from './DPageRichContent.vue'
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
import DBlockCodeExample from './DBlockCodeExample.vue'
import DBlockTerminal from './DBlockTerminal.vue'
import DBlockApi from './DBlockApi.vue'
</script>

<template>
<template v-for="(token, index) in tokens" :key="`${token.tag}-${index}`">
  <h1
    v-if="token.tag === 'h1' && renderPrimaryHeading"
    :id="token.anchorId"
    v-html="token.content"
  ></h1>
  <d-h2
    v-else-if="token.tag === 'h2'"
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

  <d-page-rich-content
    v-else-if="token.tag === 'ul'"
    tag="ul"
    :attrs="token.attrs"
    :html="token.content"
  />
  <d-page-rich-content
    v-else-if="token.tag === 'ol'"
    tag="ol"
    :attrs="token.attrs"
    :html="token.content"
  />

  <div
    v-else-if="token.tag === 'table'"
    class="d-table-wrapper"
    :class="{ 'd-table-wrapper--vs': token.highlight }"
  >
    <d-page-rich-content
      tag="table"
      :html="token.content"
    />
  </div>

  <d-page-rich-content
    v-else-if="token.tag === 'html'"
    tag="div"
    :html="token.content"
  />

  <d-block-image
    v-else-if="token.tag === 'image'"
    :content="token.content"
    :caption-html="token.captionHtml"
  />

  <d-page-rich-content
    v-else-if="token.tag === 'p'"
    tag="p"
    :html="token.content"
  />

  <d-block-blockquote
    v-else-if="token.tag === 'blockquote'"
    :message="token.alertType"
  >
    <d-page-rich-content
      tag="div"
      :html="token.content"
    />
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
    :toolbar="token.toolbar"
    :tabs="token.tabs"
  />

  <d-block-code-example
    v-else-if="token.tag === 'code-example'"
    :index="id + token.codeIndex"
    :src="token.src"
    :title="token.title"
    :caption="token.caption"
    :expanded="token.expanded"
    :codepen="token.codepen"
    :scrollable="token.scrollable"
    :overflow="token.overflow"
    :height="token.height"
  />

  <d-block-terminal
    v-else-if="token.tag === 'terminal'"
    :index="id + token.codeIndex"
    :engine="token.engine"
    :title="token.title"
    :caption="token.caption"
    :command="token.command"
    :commands="token.commands"
    :height="token.height"
    :autorun="token.autorun"
    :run-label="token.runLabel"
    :min-columns="token.minColumns || 80"
  />

  <d-block-api
    v-else-if="token.tag === 'api'"
    :src="token.src"
    :title="token.title"
    :page-link="token.pageLink"
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
    :title-html="token.titleHTML"
    :open="token.open"
  >
    <d-page-tokens
      :id="id"
      :tokens="token.tokens"
    />
  </d-block-expandable>
</template>
</template>