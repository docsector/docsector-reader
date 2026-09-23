<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { resolveFaqHash } from '../page-faq'
import DH2 from './DH2.vue'

defineOptions({
  name: 'DBlockFaq'
})

const props = defineProps({
  anchorId: {
    type: String,
    required: true
  },
  // [{ anchorId, question, questionHTML, text, tokens }] — the answer tokens
  // render through the default slot (`{ item }`), like expandable bodies
  items: {
    type: Array,
    default: () => []
  }
})

const route = useRoute()

// ! Open state per question — independent items, all closed at first
const opened = ref({})

// ? A deep link to a question (`#faq-…`) opens it; the page scrolls to the
//   hash itself (DPage), and the header does not move when the body expands
const reveal = (hash) => {
  const id = resolveFaqHash(hash, props.items)

  if (id !== null) {
    opened.value = { ...opened.value, [id]: true }
  }
}

onMounted(() => reveal(route.hash))
watch(() => route.hash, reveal)

// ? Client-side navigation may reuse this instance for another page's FAQ —
//   start it closed again (plus whatever the new hash opens)
watch(() => props.items, () => {
  opened.value = {}
  reveal(route.hash)
})
</script>

<template>
<section class="d-page-faq">
  <d-h2 :id="anchorId" :value="$t('page.faq.title')" />

  <q-list class="d-page-faq__list">
    <q-expansion-item
      v-for="item in items"
      :id="item.anchorId"
      :key="item.anchorId"
      v-model="opened[item.anchorId]"
      class="d-page-faq__item"
      switch-toggle-side
      expand-icon="chevron_right"
      expanded-icon="expand_more"
      header-class="d-page-faq__header"
    >
      <template #header>
        <q-item-section>
          <div class="d-page-faq__question" v-html="item.questionHTML" />
        </q-item-section>
      </template>

      <div class="d-page-faq__answer">
        <slot :item="item" />
      </div>
    </q-expansion-item>
  </q-list>
</section>
</template>

<style lang="sass">
body.body--light
  --d-page-faq-border: rgba(0, 0, 0, 0.12)
  --d-page-faq-hover: rgba(0, 0, 0, 0.03)
  --d-page-faq-question: #2c3e50

body.body--dark
  --d-page-faq-border: rgba(255, 255, 255, 0.12)
  --d-page-faq-hover: rgba(255, 255, 255, 0.04)
  --d-page-faq-question: var(--q-light-in-dark-2)

.d-page-faq
  margin: 2.5rem 0 1rem

  &__list
    border: 1px solid var(--d-page-faq-border)
    border-radius: 12px
    overflow: hidden

  &__item + &__item
    border-top: 1px solid var(--d-page-faq-border)

  &__header
    padding: 14px 16px
    min-height: 0

    &:hover
      background: var(--d-page-faq-hover)

    .q-item__section--side
      padding-right: 10px
      min-width: 0

  &__question
    font-size: 1rem
    font-weight: 500
    line-height: 1.45
    color: var(--d-page-faq-question)

  &__answer
    padding: 0 16px 14px 50px

    > p:last-child
      margin-bottom: 0
</style>
