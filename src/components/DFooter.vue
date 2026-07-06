<template>
  <footer class="d-footer" role="contentinfo">
    <nav v-if="legalLinks.length" class="d-footer__legal" aria-label="Legal">
      <template v-for="(link, index) in legalLinks" :key="index">
        <a
          class="d-footer__legal-link"
          :href="link.href"
          :target="link.external ? '_blank' : null"
          :rel="link.external ? 'noopener noreferrer' : null"
        >{{ link.label }}</a>
        <span v-if="index < legalLinks.length - 1" class="d-footer__legal-sep" aria-hidden="true">·</span>
      </template>
    </nav>

    <div class="d-footer__content">
      <span class="d-footer__label">Powered by</span>
      <q-btn
        class="d-footer__brand"
        unelevated
        dense
        no-caps
        color="white"
        text-color="dark"
        href="https://docsector.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Docsector website"
      >
        <img class="d-footer__logo" :src="logoUrl" alt="" width="18" height="18" />
        <span>Docsector</span>
      </q-btn>
      <span class="d-footer__suffix">— the documentation platform</span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import docsectorConfig from 'docsector.config.js'
import logoUrl from '../assets/docsector-logo.png'

defineOptions({ name: 'DFooter' })

const { locale } = useI18n()

// ? Resolve a link label that is either a plain string or a locale map ({ 'en-US': ..., 'pt-BR': ... })
const resolveLabel = (label) => {
  if (label && typeof label === 'object') {
    return label[locale.value] || label['*'] || label['en-US'] || Object.values(label)[0] || ''
  }
  return typeof label === 'string' ? label : ''
}

// : Opt-in legal/compliance links from `docsector.config.js` (footer.legalLinks); empty ⇒ row hidden
const legalLinks = computed(() => {
  const list = docsectorConfig?.footer?.legalLinks

  if (Array.isArray(list) === false) {
    return []
  }

  return list
    .filter(item => item && typeof item.href === 'string' && item.href.length > 0)
    .map(item => ({
      label: resolveLabel(item.label) || item.href,
      href: item.href,
      external: item.external === true || /^https?:\/\//i.test(item.href)
    }))
})
</script>

<style lang="sass">
.d-footer
  width: 100%
  background: var(--q-primary, #655529)
  color: #ffffff !important

  .d-footer__legal
    max-width: 1200px
    margin: 0 auto
    padding: 12px 24px 2px
    display: flex
    flex-wrap: wrap
    align-items: center
    justify-content: center
    gap: 4px 10px
    text-align: center
    font-size: 0.85rem
    line-height: 1.5

    // ? Opt out of the aggressive in-prose `.content a` styling (dark color + dotted underline)
    .d-footer__legal-link
      color: inherit !important
      opacity: 0.82
      text-decoration: none
      border-bottom: 0 !important
      transition: opacity 0.2s ease

      &:hover,
      &:focus-visible
        color: inherit !important
        background: transparent !important
        opacity: 1
        text-decoration: underline

    .d-footer__legal-sep
      opacity: 0.45

  .d-footer__content
    max-width: 1200px
    margin: 0 auto
    padding: 14px 24px
    display: flex
    flex-wrap: wrap
    align-items: center
    justify-content: center
    gap: 6px
    text-align: center
    font-size: 0.95rem
    line-height: 1.4

  .d-footer__label,
  .d-footer__suffix
    opacity: 0.84

  .d-footer__brand
    padding: 4px 10px !important
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1)

    .q-btn__content
      font-weight: 700
      gap: 6px

  .d-footer__logo
    display: block
    width: 18px
    height: 18px
    border-radius: 4px

@media (max-width: 599px)
  .d-footer
    .d-footer__legal
      padding: 10px 16px 2px
    .d-footer__content
      padding: 12px 16px
      font-size: 0.9rem
</style>
