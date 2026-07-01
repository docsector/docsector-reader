<template>
  <footer class="d-footer" role="contentinfo">
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
    </div>
  </footer>
</template>

<script setup>
import logoUrl from '../assets/docsector-logo.png'

defineOptions({ name: 'DFooter' })
</script>

<style lang="sass">
.d-footer
  width: 100%
  background: var(--q-primary, #655529)
  color: #ffffff !important

  .d-footer__content
    max-width: 1200px
    margin: 0 auto
    padding: 14px 24px
    display: flex
    align-items: center
    justify-content: center
    gap: 6px
    text-align: center
    font-size: 0.95rem
    line-height: 1.4

  .d-footer__label
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
    .d-footer__content
      padding: 12px 16px
      font-size: 0.9rem
</style>