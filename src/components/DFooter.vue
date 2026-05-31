<template>
  <footer class="d-footer" role="contentinfo">
    <div class="d-footer__content">
      <span class="d-footer__label">Powered by</span>
      <a
        class="d-footer__brand"
        href="https://docsector.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Docsector website"
      >Docsector</a>
    </div>
  </footer>
</template>

<script setup>
defineOptions({ name: 'DFooter' })
</script>

<style lang="sass">
.d-footer
  width: 100%
  background: var(--q-primary, #655529)
  color: #ffffff

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
    font-weight: 700
    color: inherit
    text-decoration: none

    &:hover,
    &:focus-visible
      text-decoration: underline

@media (max-width: 599px)
  .d-footer
    .d-footer__content
      padding: 12px 16px
      font-size: 0.9rem
</style>