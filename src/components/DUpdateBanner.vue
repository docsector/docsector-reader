<template>
<transition name="d-update-banner">
  <div
    v-if="updateAvailable"
    class="d-update-banner shadow-6"
    :class="$q.dark.isActive ? 'bg-grey-2 text-grey-10' : 'bg-grey-10 text-white'"
    role="alert"
  >
    <q-icon name="refresh" size="20px" />
    <span class="d-update-banner__message">{{ t('system.update.message') }}</span>
    <q-btn flat dense :label="t('system.update.refresh')" @click="refresh" />
    <q-btn flat dense :label="t('system.update.dismiss')" @click="dismissUpdate()" />
  </div>
</transition>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import { dismissUpdate, updateAvailable } from '../composables/useUpdateCheck'

defineOptions({ name: 'DUpdateBanner' })

// Inverse surface (dark pill on light mode, light pill on dark mode): a
// brand-colored pill can vanish against brand-colored chrome, so a neutral
// inverse surface keeps the floating pill visible on any background.
const $q = useQuasar()
const { t } = useI18n()

function refresh () {
  window.location.reload()
}
</script>

<style lang="sass">
.d-update-banner
  position: fixed
  bottom: 16px
  left: 50%
  transform: translateX(-50%)
  z-index: 6000
  display: flex
  align-items: center
  gap: 4px
  padding: 8px 8px 8px 16px
  border-radius: 8px
  max-width: min(92vw, 640px)

  &__message
    margin: 0 8px 0 4px
    font-size: 14px
    line-height: 1.35

.d-update-banner-enter-active, .d-update-banner-leave-active
  transition: opacity .3s ease, transform .3s ease

.d-update-banner-enter-from, .d-update-banner-leave-to
  opacity: 0
  transform: translate(-50%, 16px)
</style>
