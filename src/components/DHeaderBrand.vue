<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import docsectorConfig from 'docsector.config.js'

defineOptions({ name: 'DHeaderBrand' })

const { t } = useI18n()

const branding = docsectorConfig.branding || {}
// ? The brand link's accessible name comes from this visible content (logo
//   alt + lockup text) — an aria-label would fail label-content-name-mismatch
const brandName = branding.name || 'Docsector'
const brandVersion = typeof branding.version === 'string' ? branding.version.trim() : ''

// : localized lockup — each locale owns the word order around {name}
const brandLockup = computed(() => t('system.brand', { name: brandName }))
</script>

<template>
<img
  v-if="branding.logo"
  :src="branding.logo"
  :alt="brandName"
  width="26"
  height="26"
  class="d-header__brand-logo q-mr-sm"
/>
<span class="d-header__brand-text col column justify-center no-wrap">
  <span class="d-header__brand-name ellipsis text-left">{{ brandLockup }}</span>
  <span
    v-if="brandVersion"
    class="d-header__brand-version text-caption ellipsis text-left"
  >{{ brandVersion }}</span>
</span>
</template>
