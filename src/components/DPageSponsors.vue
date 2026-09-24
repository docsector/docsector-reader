<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { resolveFallbackLinkAttrs } from '../sponsors/config'

defineOptions({
  name: 'DPageSponsors'
})

const props = defineProps({
  // the normalizeSponsorsConfig() result — the parent renders this only when visible
  sponsors: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()

const fallbackAttrs = computed(() => resolveFallbackLinkAttrs(props.sponsors.fallback))
</script>

<template>
<section class="d-page-sponsors" :aria-label="t('page.sponsors.title')">
  <p class="d-page-sponsors__title" aria-hidden="true">
    <!-- ? the same heart the menu's Sponsor link carries -->
    <q-icon class="d-page-sponsors__heart" name="favorite" color="red" size="14px" />
    {{ t('page.sponsors.title') }}
  </p>

  <ul
    v-for="tier in sponsors.tiers"
    :key="tier.id"
    role="list"
    class="d-page-sponsors__tier"
    :class="`d-page-sponsors__tier--${tier.layout}`"
    :style="{ '--d-page-sponsors-columns': tier.columns, '--d-page-sponsors-ratio': tier.ratio }"
  >
    <li v-for="item in tier.items" :key="item.key">
      <a
        class="d-page-sponsors__tile"
        :class="{ 'd-page-sponsors__tile--dual': item.logoDark }"
        :href="item.href"
        target="_blank"
        rel="sponsored noopener"
      >
        <img
          class="d-page-sponsors__logo d-page-sponsors__logo--light"
          :src="item.logo"
          :alt="item.name"
          :width="tier.width"
          :height="tier.height"
          loading="lazy"
          decoding="async"
        >
        <img
          v-if="item.logoDark"
          class="d-page-sponsors__logo d-page-sponsors__logo--dark"
          :src="item.logoDark"
          :alt="item.name"
          :width="tier.width"
          :height="tier.height"
          loading="lazy"
          decoding="async"
        >
      </a>
    </li>
    <li v-if="tier.example">
      <a class="d-page-sponsors__tile d-page-sponsors__tile--example" :href="sponsors.fallback" v-bind="fallbackAttrs">
        <span class="d-page-sponsors__example">{{ t('page.sponsors.example') }}</span>
        <span class="d-page-sponsors__hint">{{ t('system.support') }}</span>
      </a>
    </li>
  </ul>

  <a v-if="sponsors.fallback" class="d-page-sponsors__cta" :href="sponsors.fallback" v-bind="fallbackAttrs">
    <span class="d-page-sponsors__cta-label">{{ t('page.sponsors.cta') }}</span>
    <span class="d-page-sponsors__hint">{{ t('system.support') }}</span>
  </a>
</section>
</template>

<style lang="sass">
body.body--light .d-page-sponsors
  --d-page-sponsors-tile-bg: #ffffff
  --d-page-sponsors-border: rgba(15, 23, 42, 0.10)
  --d-page-sponsors-divider: rgba(15, 23, 42, 0.08)
  --d-page-sponsors-muted: #475569
  --d-page-sponsors-dashed: rgba(15, 23, 42, 0.5)
  --d-page-sponsors-plate: #ffffff

body.body--dark .d-page-sponsors
  --d-page-sponsors-tile-bg: rgba(255, 255, 255, 0.04)
  --d-page-sponsors-border: rgba(255, 255, 255, 0.14)
  --d-page-sponsors-divider: rgba(255, 255, 255, 0.10)
  --d-page-sponsors-muted: #94a3b8
  --d-page-sponsors-dashed: rgba(255, 255, 255, 0.45)
  --d-page-sponsors-plate: #f1f5f9

.d-page-sponsors
  margin-top: 8px
  padding: 16px 12px
  border-top: 1px solid var(--d-page-sponsors-divider)

  &__title
    display: flex
    align-items: center
    gap: 6px
    margin: 0 0 8px
    font-size: 12px
    line-height: 16px
    font-weight: 600
    text-transform: uppercase
    letter-spacing: 0.06em
    color: var(--d-page-sponsors-muted)

  &__tier
    list-style: none
    margin: 0 0 8px
    padding: 0
    display: grid
    grid-template-columns: repeat(var(--d-page-sponsors-columns, 2), minmax(0, 1fr))
    gap: 8px

  &__tile
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    gap: 2px
    box-sizing: border-box
    aspect-ratio: var(--d-page-sponsors-ratio, 1 / 1)
    padding: 12px
    border: 1px solid var(--d-page-sponsors-border)
    border-radius: 8px
    background: var(--d-page-sponsors-tile-bg)
    color: var(--d-page-sponsors-muted)
    text-align: center
    text-decoration: none
    transition: border-color 0.2s, color 0.2s

    &:hover
      border-color: var(--q-primary)

    &:focus-visible
      outline: 2px solid var(--q-primary)
      outline-offset: 2px

  &__tile--example
    border-style: dashed
    border-color: var(--d-page-sponsors-dashed)
    background: transparent

    &:hover
      color: var(--q-primary)

  &__logo
    display: block
    width: 100%
    height: 100%
    object-fit: contain

  &__logo--dark
    display: none

  &__example,
  &__cta-label
    font-size: 13px
    font-weight: 500
    line-height: 1.3

  &__hint
    font-size: 11px
    line-height: 1.3

  &__cta
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    gap: 2px
    min-height: 56px
    margin-top: 4px
    box-sizing: border-box
    border: 1px dashed var(--d-page-sponsors-dashed)
    border-radius: 8px
    color: var(--d-page-sponsors-muted)
    text-align: center
    text-decoration: none
    transition: border-color 0.2s, color 0.2s

    &:hover,
    &:focus-visible
      border-color: var(--q-primary)
      color: var(--q-primary)

    &:focus-visible
      outline: 2px solid var(--q-primary)
      outline-offset: 2px

// ? Theme-driven logo swap: body--light / body--dark are stamped before first
//   paint, so the server markup never depends on the theme
body.body--dark
  .d-page-sponsors__tile--dual
    .d-page-sponsors__logo--light
      display: none

    .d-page-sponsors__logo--dark
      display: block

  // ? a single-variant logo keeps a light plate, so dark-on-transparent art stays legible
  .d-page-sponsors__tile:not(.d-page-sponsors__tile--dual):not(.d-page-sponsors__tile--example)
    background: var(--d-page-sponsors-plate)

@media (forced-colors: active)
  .d-page-sponsors__tile,
  .d-page-sponsors__cta
    border-color: CanvasText

@media (prefers-reduced-motion: reduce)
  .d-page-sponsors__tile,
  .d-page-sponsors__cta
    transition: none
</style>
