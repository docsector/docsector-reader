<script setup>
// defineProps is a compiler macro in <script setup>, no import needed
import { useI18n } from 'vue-i18n'

import DHeaderLinkItem from './DHeaderLinkItem.vue'
import { move } from '../composables/menu-keys'

defineOptions({ name: 'DHeaderLinks' })

defineProps({
  // [{ label, icon, attrs, active, children: [{ label, icon, attrs, active }] }]
  links: {
    type: Array,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
<!-- ? shown by CSS (DefaultLayout) where the header has room; otherwise the same links
     open from the arrow attached to the brand -->
<nav class="d-header__nav" :aria-label="t('header.links')">
  <template v-for="(link, index) in links" :key="index">
    <q-btn-dropdown
      v-if="link.children.length > 0"
      class="d-header__link"
      :class="{ 'd-header__link--active': link.active }"
      :icon="link.icon"
      :label="link.label"
      :toggle-aria-label="link.label"
      content-class="d-header-links__menu"
      menu-anchor="bottom middle"
      menu-self="top middle"
      flat
      no-caps
      no-wrap
      stretch
    >
      <q-list role="none" data-autofocus @keydown="move">
        <d-header-link-item v-for="(child, childIndex) in link.children" :key="childIndex" :link="child" />
      </q-list>
    </q-btn-dropdown>
    <q-btn
      v-else
      v-bind="link.attrs"
      class="d-header__link"
      :class="{ 'd-header__link--active': link.active }"
      :aria-current="link.active ? 'page' : null"
      :icon="link.icon"
      :label="link.label"
      flat
      no-caps
      no-wrap
      stretch
    >
      <template v-if="link.attrs.target">
        <q-icon class="q-ml-xs" name="open_in_new" size="xs" />
        <span class="d-sr-only">{{ t('header.newTab') }}</span>
      </template>
    </q-btn>
  </template>
</nav>
</template>
