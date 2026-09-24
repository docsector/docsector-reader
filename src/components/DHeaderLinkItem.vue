<script setup>
// defineProps is a compiler macro in <script setup>, no import needed
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DHeaderLinkItem' })

defineProps({
  // { label, icon, attrs: { to } | { href, target }, active }
  link: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
<!-- ? one row of the header links menus — a page of the site opens in place
     (highlighted while open), anything else in a new tab -->
<q-item
  v-bind="link.attrs"
  :active="link.active"
  :aria-current="link.active ? 'page' : null"
  class="d-header-link-item"
  clickable
  role="menuitem"
  v-close-popup
>
  <q-item-section v-if="link.icon" side>
    <q-icon :name="link.icon" size="xs" />
  </q-item-section>
  <q-item-section>{{ link.label }}</q-item-section>
  <q-item-section v-if="link.attrs.target" side>
    <q-icon name="open_in_new" size="xs" />
    <span class="d-sr-only">{{ t('header.newTab') }}</span>
  </q-item-section>
</q-item>
</template>
