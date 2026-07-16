<script setup>
// defineProps is a compiler macro in <script setup>, no import needed
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { namespacedLabelI18nPath, routeTitleI18nPath } from '../i18n/path'
import { menuSeparatorClass, normalizeMenuSeparators } from './menu-separators'

const $route = useRoute()
const $router = useRouter()
const { t } = useI18n()

const props = defineProps({
  items: {
    type: Number,
    required: true
  },
  subitem: {
    type: Object,
    required: true
  },
  subindex: {
    type: Number,
    required: true
  },
  subpage: {
    type: String,
    required: true
  },
  founds: {
    type: [Boolean, Array, Object],
    required: true
  }
})

// Lines around the item — `separators.lineTop`/`lineBottom` (legacy `separator` = lineBottom)
const separators = computed(() => normalizeMenuSeparators(props.subitem?.meta?.menu))

const getMenuItemLabel = (item) => {
  if (!item?.path) {
    return ''
  }

  return t(routeTitleI18nPath(item.path))
}

const getMenuItemSubheader = (meta = {}) => {
  const subheader = meta.menu?.subheader
  if (!subheader) {
    return ''
  }

  const book = meta.book ?? meta.type ?? 'manual'
  const path = namespacedLabelI18nPath(book, subheader)

  return t(path)
}

const getPageStatusText = (status) => {
  if (status === 'new') {
    return t('menu.status.new._')
  }

  if (status === 'draft') {
    return t('menu.status.draft._')
  } else {
    return t('menu.status.empty._')
  }
}

const getPageStatusTextColor = (status) => {
  if (status === 'new') {
    return null
  }

  if (status === 'draft') {
    return 'dark'
  } else {
    return 'white'
  }
}

const getPageStatusStyle = (status) => {
  return status === 'new' ? { color: '#151515' } : null
}

const getPageStatusColor = (status) => {
  if (status === 'new') {
    return 'positive'
  }

  if (status === 'draft') {
    return 'orange'
  } else {
    return 'red'
  }
}

const getPageStatusTooltip = (status, pageVersion) => {
  if (status === 'new') {
    return pageVersion
      ? t('menu.status.new.tooltipVersion', { version: pageVersion })
      : t('menu.status.new.tooltip')
  }

  if (status === 'draft') {
    return t('menu.status.draft.tooltip')
  } else {
    return t('menu.status.empty.tooltip')
  }
}

const normalizePath = (path) => {
  if (!path) {
    return '/'
  }

  const normalized = String(path).replace(/\/+$/, '')
  return normalized === '' ? '/' : normalized
}

const isMenuItemActive = (path) => {
  return normalizePath(path) === normalizePath($route.path)
}

const getMenuItemTargetPath = (path) => {
  return `${path}/overview/`
}

const getMenuItemTo = (path) => {
  return getMenuItemTargetPath(path)
}

const onMenuItemClick = (event, path, currentSubpage) => {
  const currentPath = `${path}${currentSubpage}`
  if (!isMenuItemActive(currentPath)) {
    return
  }

  event?.preventDefault?.()
  event?.stopPropagation?.()

  if ($route.hash) {
    $router.replace({ path: $route.path, hash: '' })
  }
}
</script>

<template>
<!-- Menu Separator - Subheader -->
<q-item-section v-if="subitem?.meta?.menu?.subheader" class="subheader-section">
  <q-item-label class="label subheader" header>
    {{ getMenuItemSubheader(subitem.meta) }}
  </q-item-label>
</q-item-section>

<!-- Menu Separator - line above the item -->
<li v-if="separators.lineTop" role="listitem">
  <q-separator
    :class="menuSeparatorClass(separators.lineTop)"
    role="separator"
  />
</li>

<q-item
  v-if="subitem?.path"
  :to="getMenuItemTo(subitem.path)"
  :active="isMenuItemActive(subitem.path + subpage)"
  :class="{ 'd-menu-item--active': isMenuItemActive(subitem.path + subpage) }"
  clickable
  @click="onMenuItemClick($event, subitem.path, subpage)"
  v-show="founds[subitem.path] || !founds"
>
  <q-item-section side>
    <q-icon v-if="subitem?.meta?.icon" :name="subitem.meta.icon" />
  </q-item-section>
  <q-item-section>
    {{ getMenuItemLabel(subitem) }}
  </q-item-section>
  <q-item-section class="page-status" v-if="subitem?.meta && subitem.meta.status !== 'done'" side>
    <q-badge
      :text-color="getPageStatusTextColor(subitem.meta.status)"
      :color="getPageStatusColor(subitem.meta.status)"
      :label="getPageStatusText(subitem.meta.status)"
      :style="getPageStatusStyle(subitem.meta.status)"
    />
    <q-tooltip :hide-delay="3">{{ getPageStatusTooltip(subitem.meta.status, subitem.meta.pageVersion) }}</q-tooltip>
  </q-item-section>
</q-item>

<!-- Menu Separator - line below the item -->
<li v-if="separators.lineBottom" role="listitem">
  <q-separator
    :class="menuSeparatorClass(separators.lineBottom)"
    role="separator"
  />
</li>
</template>

<style lang="sass">
.d-menu-item--active
  cursor: pointer
  user-select: none
  -webkit-user-select: none
</style>
