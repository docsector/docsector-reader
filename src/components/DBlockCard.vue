<script setup>
const BASE_URL = import.meta.env.BASE_URL || '/'

defineOptions({
  name: 'DBlockCard'
})

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

const itemTag = (item) => {
  if (item?.to) return 'router-link'
  return 'a'
}

const itemProps = (item) => {
  if (item?.to) {
    return {
      to: item.to
    }
  }

  const href = item?.href || ''
  return {
    href,
    target: isExternal(item) ? '_blank' : undefined,
    rel: isExternal(item) ? 'noopener noreferrer' : undefined
  }
}

const resolveAssetUrl = (raw = '') => {
  const value = String(raw || '').trim()

  if (!value) {
    return ''
  }

  if (/^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data:|blob:)/i.test(value)) {
    return value
  }

  const trimmedBase = String(BASE_URL).replace(/\/$/, '')

  if (value.startsWith('/')) {
    return `${trimmedBase}${value}` || value
  }

  const normalized = value.replace(/^\.\//, '')
  return `${trimmedBase}/${normalized}`.replace(/\/+/g, '/')
}
</script>

<template>
<div class="d-cards">
  <h3 v-if="title" class="d-cards__title">{{ title }}</h3>

  <div class="d-cards__grid">
    <component
      :is="itemTag(item)"
      v-for="(item, index) in props.items"
      :key="`${item.title}-${index}`"
      class="d-cards__link"
      v-bind="itemProps(item)"
    >
      <q-card flat bordered class="d-cards__card">
        <q-img
          v-if="item.image"
          :src="resolveAssetUrl(item.image)"
          :alt="item.title"
          ratio="1.7778"
          class="d-cards__image"
        />

        <q-card-section v-else-if="item.icon" class="d-cards__icon-section">
          <div class="d-cards__icon-surface">
            <q-icon :name="item.icon" size="56px" color="primary" />
          </div>
        </q-card-section>

        <q-card-section class="d-cards__body">
          <div class="d-cards__heading-row">
            <div class="d-cards__heading-group">
              <q-icon
                v-if="item.image && item.icon"
                :name="item.icon"
                size="18px"
                color="primary"
              />
              <div class="d-cards__label">{{ item.title }}</div>
            </div>

            <q-icon :name="isExternal(item) ? 'arrow_outward' : 'arrow_forward'" size="18px" />
          </div>

          <div class="d-cards__description">{{ item.description }}</div>
        </q-card-section>
      </q-card>
    </component>
  </div>
</div>
</template>

<style lang="sass">
body.body--light
  --d-cards-card-bg: #fffdf8
  --d-cards-card-border: rgba(123, 94, 45, 0.16)
  --d-cards-card-shadow: rgba(94, 73, 37, 0.08)
  --d-cards-card-shadow-hover: rgba(94, 73, 37, 0.16)
  --d-cards-description: #4d5563
  --d-cards-icon-surface: linear-gradient(180deg, rgba(210, 190, 145, 0.22), rgba(210, 190, 145, 0.08))

body.body--dark
  --d-cards-card-bg: rgba(255, 248, 235, 0.035)
  --d-cards-card-border: rgba(255, 235, 194, 0.12)
  --d-cards-card-shadow: rgba(0, 0, 0, 0.25)
  --d-cards-card-shadow-hover: rgba(0, 0, 0, 0.38)
  --d-cards-description: rgba(255, 255, 255, 0.82)
  --d-cards-icon-surface: linear-gradient(180deg, rgba(193, 166, 103, 0.18), rgba(193, 166, 103, 0.05))

.d-cards
  margin: 0 auto

.d-cards__title
  text-align: center
  margin: 0 0 16px

.d-cards__grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
  gap: 16px

.d-cards__link
  display: block
  color: inherit
  text-decoration: none
  border-bottom: 0 !important
  background: transparent !important

.d-cards__link:hover,
.d-cards__link:focus-visible,
.d-cards__link:active,
.d-cards__link:visited
  color: inherit !important
  text-decoration: none
  border-bottom: 0 !important
  background: transparent !important

.d-cards__card
  height: 100%
  overflow: hidden
  border-radius: 18px
  background: var(--d-cards-card-bg)
  border-color: var(--d-cards-card-border)
  box-shadow: 0 12px 28px var(--d-cards-card-shadow)
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease

.d-cards__link:hover .d-cards__card,
.d-cards__link:focus-visible .d-cards__card
  transform: translateY(-2px)
  box-shadow: 0 18px 36px var(--d-cards-card-shadow-hover)

.d-cards__link:focus-visible
  outline: none

.d-cards__image
  background: rgba(0, 0, 0, 0.05)

.d-cards__icon-section
  display: flex
  padding-bottom: 0

.d-cards__icon-surface
  display: flex
  align-items: center
  justify-content: center
  width: 100%
  min-height: 156px
  border-radius: 14px
  background: var(--d-cards-icon-surface)

.d-cards__body
  display: grid
  gap: 10px

.d-cards__heading-row
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 12px

.d-cards__heading-group
  display: flex
  align-items: center
  gap: 8px
  min-width: 0

.d-cards__label
  font-size: 1rem
  font-weight: 700
  line-height: 1.35

.d-cards__description
  color: var(--d-cards-description)
  font-size: 0.97rem
  line-height: 1.55

@media (max-width: 599px)
  .d-cards__grid
    grid-template-columns: 1fr
</style>