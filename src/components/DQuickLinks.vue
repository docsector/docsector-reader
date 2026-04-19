<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
})

const isExternal = (item) => {
  const href = item?.href || ''
  return /^https?:\/\//i.test(href)
}

const toTarget = (item) => {
  if (item?.to) return item.to
  return undefined
}

const hrefTarget = (item) => {
  if (item?.href) return item.href
  return undefined
}

const relValue = (item) => {
  if (isExternal(item)) return 'noopener noreferrer'
  return undefined
}

const targetValue = (item) => {
  if (isExternal(item)) return '_blank'
  return undefined
}
</script>

<template>
<div class="d-quick-links">
  <h3 v-if="title" class="d-quick-links__title">{{ title }}</h3>

  <q-list bordered separator class="d-quick-links__list rounded-borders">
    <q-item
      v-for="(item, index) in props.items"
      :key="index"
      clickable
      :to="toTarget(item)"
      :href="hrefTarget(item)"
      :target="targetValue(item)"
      :rel="relValue(item)"
    >
      <q-item-section avatar>
        <q-icon :name="item.icon || 'link'" color="primary" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="d-quick-links__label">{{ item.title }}</q-item-label>
        <q-item-label caption class="d-quick-links__caption">{{ item.description }}</q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-icon name="chevron_right" />
      </q-item-section>
    </q-item>
  </q-list>
</div>
</template>

<style lang="sass" scoped>
.d-quick-links
  margin: 0 auto

.d-quick-links__title
  text-align: center
  margin: 0 0 12px

.d-quick-links__list
  border-color: rgba(255, 255, 255, 0.16)

  .q-item
    min-height: 58px

.d-quick-links__label
  font-weight: 700

.d-quick-links__caption
  font-size: 0.97rem
  color: #4d5563
  opacity: 1


:global(body.body--dark) .d-quick-links__list
  border-color: rgba(255, 255, 255, 0.16)

:global(body.body--dark) .d-quick-links__caption
  color: rgba(255, 255, 255, 0.9)
</style>
