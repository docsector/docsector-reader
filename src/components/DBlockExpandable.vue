<script setup>
defineOptions({
  name: 'DBlockExpandable'
})

defineProps({
  title: {
    type: String,
    default: ''
  },
  open: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
<q-expansion-item
  class="d-page-expandable"
  switch-toggle-side
  :default-opened="open"
  header-class="d-page-expandable__header"
  content-class="d-page-expandable__content"
>
  <template #header>
    <q-item-section>
      <div class="d-page-expandable__title">{{ title }}</div>
    </q-item-section>
  </template>

  <div class="d-page-expandable__body">
    <slot />
  </div>
</q-expansion-item>
</template>

<style lang="sass">
body.body--light
  --d-page-expandable-bg: #faf8f2
  --d-page-expandable-border: rgba(116, 92, 46, 0.18)
  --d-page-expandable-divider: rgba(116, 92, 46, 0.12)
  --d-page-expandable-shadow: rgba(116, 92, 46, 0.08)

body.body--dark
  --d-page-expandable-bg: rgba(255, 248, 235, 0.035)
  --d-page-expandable-border: rgba(255, 235, 194, 0.14)
  --d-page-expandable-divider: rgba(255, 235, 194, 0.08)
  --d-page-expandable-shadow: rgba(0, 0, 0, 0.28)

.d-page-expandable
  margin: 1.5rem 0
  border: 1px solid var(--d-page-expandable-border)
  border-radius: 16px
  overflow: hidden
  background: var(--d-page-expandable-bg)
  box-shadow: 0 14px 32px var(--d-page-expandable-shadow)

  .q-item
    min-height: 0
    padding: 0
    height: 35px

  .q-item__section--side
    padding-left: 0.55rem

.d-page-expandable__header
  padding: 0.95rem 1rem

.d-page-expandable__title
  font-size: 1rem
  font-weight: 700
  line-height: 1.45

.d-page-expandable__body
  padding: 1rem 1rem 1.1rem

  > :first-child
    margin-top: 0

  > :last-child
    margin-bottom: 0
</style>