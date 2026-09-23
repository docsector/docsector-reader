<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { versions } from 'virtual:docsector-books'

import { usePageFeedback } from '../composables/usePageFeedback.js'
import { RATINGS } from '../feedback/client.js'

const route = useRoute()
const { locale } = useI18n()

// ! Vote target — pages carry their docs version in route meta; routes outside
//   the books (the homepage) vote on the current one
const currentVersionId = versions.find(version => version.current)?.id ?? ''
const target = computed(() => ({
  path: route.path,
  locale: locale.value,
  version: route.matched?.[0]?.meta?.version ?? currentVersionId
}))

const { rating, vote } = usePageFeedback(target)
</script>

<template>
<div class="d-page-feedback" role="group" :aria-label="$t('page.feedback.question')">
  <div class="d-page-feedback__label" aria-live="polite">
    {{ rating === null ? $t('page.feedback.question') : $t('page.feedback.thanks') }}
  </div>
  <div class="d-page-feedback__options">
    <q-btn
      v-for="option in RATINGS"
      :key="option.value"
      class="d-page-feedback__option"
      :class="[
        `d-page-feedback__option--${option.value}`,
        {
          'd-page-feedback__option--active': rating === option.value,
          'd-page-feedback__option--muted': rating !== null && rating !== option.value
        }
      ]"
      flat
      round
      dense
      :icon="option.icon"
      :aria-label="$t(`page.feedback.${option.value}`)"
      :aria-pressed="rating === option.value ? 'true' : 'false'"
      @click="vote(option.value)"
    >
      <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
        {{ rating === option.value ? $t('page.feedback.undo') : $t(`page.feedback.${option.value}`) }}
      </q-tooltip>
    </q-btn>
  </div>
</div>
</template>

<style lang="sass">
.d-page-feedback
  display: flex
  flex-direction: column
  align-items: flex-end
  gap: 6px

  &__label
    font-size: 0.875rem
    font-weight: 500
    color: #616161

  &__options
    display: inline-flex
    gap: 4px
    padding: 3px 8px
    border: 1px solid #e0e0e0
    border-radius: 999px

  &__option
    color: var(--d-feedback-tone)
    transition: opacity 0.2s, background-color 0.2s

    .q-icon
      font-size: 28px

    &--positive
      --d-feedback-tone: #2e7d32
    &--neutral
      --d-feedback-tone: #f9a825
    &--negative
      --d-feedback-tone: #c62828

    &--active
      background: color-mix(in srgb, var(--d-feedback-tone) 18%, transparent)

    &--muted
      opacity: 0.45

      &:hover
        opacity: 1

body.body--dark
  .d-page-feedback
    &__label
      color: var(--q-light-in-dark-1)

    &__options
      border-color: #3a3a3a

    &__option
      &--positive
        --d-feedback-tone: #66bb6a
      &--neutral
        --d-feedback-tone: #fdd835
      &--negative
        --d-feedback-tone: #ef5350
</style>
