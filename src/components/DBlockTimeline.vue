<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useSsrSafeDark } from '../composables/useSsrSafeDark'
import { useSsrSafeScreenWidth } from '../composables/useSsrSafeScreen'

defineOptions({
  name: 'DBlockTimeline'
})

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const $q = useQuasar()
const darkActive = useSsrSafeDark()
const screenWidth = useSsrSafeScreenWidth()
const { locale } = useI18n()

const timelineLayout = computed(() => {
  return screenWidth.value < 600 ? 'dense' : 'comfortable'
})

const formatDate = (rawDate = '') => {
  const normalized = String(rawDate).trim()
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), 12)

    return new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsed)
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return normalized
  }

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(parsed)
}

const stripHtmlTags = (value = '') => {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const getTitleTokenIndex = (tokens = []) => {
  return tokens.findIndex((token) => {
    return typeof token?.content === 'string' && stripHtmlTags(token.content) !== ''
  })
}

const entries = computed(() => {
  return props.items.map((item, index) => {
    const titleTokenIndex = getTitleTokenIndex(item.tokens)
    const titleText = titleTokenIndex === -1
      ? `Update ${index + 1}`
      : stripHtmlTags(item.tokens[titleTokenIndex].content)

    return {
      ...item,
      formattedDate: formatDate(item.date),
      titleText,
      tags: item.tags.map((tag) => ({
        label: tag?.label || '',
        color: tag?.color || '',
        textColor: tag?.textColor || '',
        icon: tag?.icon || ''
      })),
      tokens: titleTokenIndex !== -1 && item.tokens[titleTokenIndex]?.tag === 'p'
        ? item.tokens.filter((_, tokenIndex) => tokenIndex !== titleTokenIndex)
        : item.tokens
    }
  })
})
</script>

<template>
<div v-if="entries.length" class="d-timeline">
  <q-timeline
    color="secondary"
    :layout="timelineLayout"
    side="right"
    :dark="darkActive"
    class="d-timeline__shell"
  >
    <q-timeline-entry
      v-for="(item, index) in entries"
      :id="item.anchorId"
      :key="`${item.anchorId}-${index}`"
      class="d-timeline__entry"
    >
      <template #title>
        <span class="d-timeline__title-row">
          <span class="d-timeline__title-text">{{ item.titleText }}</span>

          <a
            class="d-timeline__anchor"
            :href="`#${item.anchorId}`"
            aria-label="Direct link to timeline item"
          >
            <q-icon name="link" size="16px" aria-hidden="true" />
          </a>
        </span>
      </template>

      <template #subtitle>
        <span class="d-timeline__subtitle-text">{{ item.formattedDate }}</span>
      </template>

      <div class="d-timeline__body">
        <div v-if="item.tags.length" class="d-timeline__tags">
          <q-chip
            v-for="(tag, tagIndex) in item.tags"
            :key="`${item.anchorId}-${tag.label}-${tagIndex}`"
            dense
            square
            :icon="tag.icon || void 0"
            :color="tag.color || void 0"
            :text-color="tag.textColor || void 0"
            :class="[
              'd-timeline__tag',
              { 'd-timeline__tag--default': tag.color === '' }
            ]"
          >
            {{ tag.label }}
          </q-chip>
        </div>

        <slot :item="item" :index="index" />
      </div>
    </q-timeline-entry>
  </q-timeline>
</div>
</template>

<style lang="sass">
body.body--light
  --d-timeline-title: #1d2733
  --d-timeline-subtitle: #7d5516
  --d-timeline-anchor-bg: rgba(150, 105, 39, 0.08)
  --d-timeline-anchor-bg-hover: rgba(150, 105, 39, 0.16)
  --d-timeline-anchor-text: #7d5516
  --d-timeline-tag-bg: rgba(150, 105, 39, 0.1)
  --d-timeline-tag-text: #6b4a18

body.body--dark
  --d-timeline-title: #f5f7fa
  --d-timeline-subtitle: #f4d394
  --d-timeline-anchor-bg: rgba(255, 232, 190, 0.08)
  --d-timeline-anchor-bg-hover: rgba(255, 232, 190, 0.16)
  --d-timeline-anchor-text: #f4d394
  --d-timeline-tag-bg: rgba(255, 232, 190, 0.1)
  --d-timeline-tag-text: #f7e0b3

.d-timeline
  margin: 1.5rem 0
  --d-timeline-sticky-top: 0.75rem

.d-timeline__shell
  &.q-timeline--comfortable
    .q-timeline__subtitle
      width: 1%
      white-space: nowrap

      > span
        position: sticky
        position: -webkit-sticky
        top: var(--d-timeline-sticky-top)
        display: inline-block
        z-index: 1

    .q-timeline__dot
      position: sticky !important
      position: -webkit-sticky !important
      top: var(--d-timeline-sticky-top)
      bottom: auto !important
      z-index: 2

      &:after
        top: 25px

      &:before
        top: 6px
        content: ''
      &:after
        bottom: -3px
        content: ''

    .q-timeline__content
      padding-left: 0 !important

    .q-timeline__title
      padding-top: 0 !important
      padding-left: 0 !important

    .d-timeline__entry:last-child
      .q-timeline__dot:after
        content: '' !important

  .q-timeline__title
    margin: 0
    padding: 0
    font-size: 1.3rem
    font-weight: 700
    line-height: 1.35
    color: var(--d-timeline-title)
    cursor: default
    user-select: text

    &:before,
    &:after,
    &:hover:after
      content: none

    &:hover
      color: var(--d-timeline-title)

  .q-timeline__subtitle
    color: var(--d-timeline-subtitle)
    font-size: 0.84rem
    font-weight: 700
    line-height: 1.35
    letter-spacing: 0.06em
    text-transform: uppercase

  .q-timeline__content
    min-width: 0

.d-timeline__entry
  .q-timeline__content > :last-child
    margin-bottom: 0

.d-timeline__title-row
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 0.75rem
  width: 100%

.d-timeline__title-text
  min-width: 0

.d-timeline__subtitle-text
  display: inline-block
  min-width: 0
  margin-top: 4px

.d-timeline__body
  min-width: 0

  > :first-child
    margin-top: 0

.d-timeline__tags
  display: flex
  flex-wrap: wrap
  gap: 0.45rem
  margin: 0 0 0.8rem

.d-timeline__tag
  margin: 0

.d-timeline__tag--default
  background: var(--d-timeline-tag-bg)
  color: var(--d-timeline-tag-text)
  font-weight: 600

.d-timeline__anchor
  flex: none
  display: inline-flex
  align-items: center
  justify-content: center
  width: 2rem
  height: 2rem
  border-radius: 999px
  background: var(--d-timeline-anchor-bg)
  color: var(--d-timeline-anchor-text)
  text-decoration: none
  font-size: 1rem
  font-weight: 700
  transition: background-color 0.2s ease, transform 0.2s ease

  &:hover,
  &:focus-visible
    background: var(--d-timeline-anchor-bg-hover)
    transform: translateY(-1px)

@media (max-width: 599px)
  .d-timeline__shell
    .q-timeline__title
      font-size: 1.16rem

    .q-timeline__subtitle
      font-size: 0.78rem

  .d-timeline__title-row
    gap: 0.55rem

  .d-timeline__anchor
    width: 1.8rem
    height: 1.8rem
</style>