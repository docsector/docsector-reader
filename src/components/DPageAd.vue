<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { resolveAdLinkAttrs } from '../ads/config'
import { resolveLocaleMap } from '../i18n/locale-map'

defineOptions({
  name: 'DPageAd'
})

const props = defineProps({
  // a creative picked by resolvePageAd(), or its example ad ({ example: true, href })
  ad: {
    type: Object,
    required: true
  }
})

const { t, locale } = useI18n()

const title = computed(() => props.ad.example ? t('page.ad.example') : resolveLocaleMap(props.ad.title, locale.value))
const text = computed(() => props.ad.example ? t('system.support') : resolveLocaleMap(props.ad.text, locale.value))
const linkAttrs = computed(() => resolveAdLinkAttrs(props.ad))
</script>

<template>
<aside class="d-page-ad" :class="{ 'd-page-ad--example': ad.example }" :aria-label="t('page.ad.label')">
  <span class="d-page-ad__label" aria-hidden="true">{{ t('page.ad.label') }}</span>
  <a class="d-page-ad__link" :href="ad.href" v-bind="linkAttrs">
    <span class="d-page-ad__card" :class="{ 'd-page-ad__card--media': ad.image }">
      <!-- ? eager on purpose: the ad sits above the fold, and its fixed box
           keeps the layout still while the image loads -->
      <img
        v-if="ad.image"
        class="d-page-ad__image"
        :src="ad.image"
        alt=""
        width="128"
        height="96"
        decoding="async"
      >
      <span class="d-page-ad__body">
        <span class="d-page-ad__title">{{ title }}</span>
        <span v-if="text" class="d-page-ad__text">{{ text }}</span>
      </span>
    </span>
  </a>
</aside>
</template>

<style lang="sass">
body.body--light .d-page-ad
  --d-page-ad-bg: #ffffff
  --d-page-ad-border: rgba(15, 23, 42, 0.12)
  --d-page-ad-title: #1f2937
  --d-page-ad-muted: #475569

body.body--dark .d-page-ad
  --d-page-ad-bg: rgba(255, 255, 255, 0.04)
  --d-page-ad-border: rgba(255, 255, 255, 0.14)
  --d-page-ad-title: var(--q-light-in-dark-2)
  --d-page-ad-muted: #94a3b8

.d-page-ad
  position: relative
  margin: 12px 0 24px

  &__label
    position: absolute
    top: 6px
    right: 8px
    z-index: 1
    pointer-events: none
    font-size: 10px
    line-height: 1
    text-transform: uppercase
    letter-spacing: 0.06em
    color: var(--d-page-ad-muted)

  &__card
    display: grid
    grid-template-columns: minmax(0, 1fr)
    gap: 16px
    align-items: center
    box-sizing: border-box
    height: 112px
    padding: 8px 44px 8px 16px
    border: 1px solid var(--d-page-ad-border)
    border-radius: 8px
    background: var(--d-page-ad-bg)
    overflow: hidden
    transition: border-color 0.2s

  &__card--media
    grid-template-columns: 128px minmax(0, 1fr)
    padding-left: 8px

  &__image
    display: block
    width: 128px
    height: 96px
    object-fit: cover
    border-radius: 6px

  &__body
    display: flex
    flex-direction: column
    min-width: 0

  &__title
    display: -webkit-box
    -webkit-line-clamp: 1
    -webkit-box-orient: vertical
    overflow: hidden
    font-size: 15px
    line-height: 1.35
    font-weight: 600
    color: var(--d-page-ad-title)

  &__text
    display: -webkit-box
    -webkit-line-clamp: 2
    -webkit-box-orient: vertical
    overflow: hidden
    margin-top: 4px
    font-size: 13px
    line-height: 1.45
    color: var(--d-page-ad-muted)

// ? absorbs the global `.content a` rules (dotted border, tint, bold, padding)
//   in every state — the DBlockCards pattern
.d-page-ad__link,
.d-page-ad__link:hover,
.d-page-ad__link:focus-visible,
.d-page-ad__link:active,
.d-page-ad__link:visited
  display: block
  padding: 0 !important
  border-bottom: 0 !important
  background: transparent !important
  font-weight: 400 !important
  color: inherit !important
  text-decoration: none
  transition: none !important

.d-page-ad__link:focus-visible
  outline: 2px solid var(--q-primary)
  outline-offset: 2px
  border-radius: 8px

.d-page-ad__link:hover .d-page-ad__card,
.d-page-ad__link:focus-visible .d-page-ad__card
  border-color: var(--q-primary)

.d-page-ad--example .d-page-ad__card
  border-style: dashed
  background: transparent

@media (max-width: 599px)
  .d-page-ad__card
    height: 88px
    gap: 12px

  .d-page-ad__card--media
    grid-template-columns: 96px minmax(0, 1fr)

  .d-page-ad__image
    width: 96px
    height: 72px

@media print
  .d-page-ad
    display: none

@media (forced-colors: active)
  .d-page-ad__card
    border-color: CanvasText

@media (prefers-reduced-motion: reduce)
  .d-page-ad__card
    transition: none
</style>
