<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'DBlockImage'
})

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  captionHtml: {
    type: String,
    default: ''
  }
})

const hasCaption = computed(() => {
  return String(props.captionHtml || '').trim() !== ''
})
</script>

<template>
<figure class="d-page-image">
  <q-zoom
    class="d-page-image__zoom"
    background-color="rgba(18, 18, 20, 0.96)"
    show-close-button
  >
    <div class="d-page-image__media" v-html="content"></div>
  </q-zoom>

  <figcaption v-if="hasCaption" class="d-page-image__caption" v-html="captionHtml"></figcaption>
</figure>
</template>

<style lang="sass" scoped>
.d-page-image
  display: flex
  flex-direction: column
  align-items: center
  gap: 0.75rem
  width: 100%
  margin: 1.75rem auto
  text-align: center

.d-page-image__zoom
  display: inline-block
  width: fit-content
  max-width: 100%

.d-page-image__media
  display: inline-flex
  align-items: center
  justify-content: center
  line-height: 0
  max-width: 100%

  :deep(img),
  :deep(picture)
    display: block
    max-width: 100%

.d-page-image__caption
  max-width: min(100%, 42rem)
  margin: 0
  padding: 0 1rem
  color: inherit
  opacity: 0.72
  font-size: 0.92rem
  line-height: 1.45
  text-align: center

  :deep(p)
    margin: 0

  :deep(*)
    color: inherit
</style>