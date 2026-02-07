<script setup>
// defineProps is a compiler macro in <script setup>, no import needed
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

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
    type: [Boolean, Array],
    required: true
  }
})

const $q = useQuasar()
const $route = useRoute()
const { t, te } = useI18n()

const getMenuItemHeaderBackground = () => {
  return $q.dark.isActive ? 'background-color: #1D1D1D !important' : 'background-color: #f5f5f5 !important'
}

const getMenuItemLabel = (item, index) => {
  const path = `_${item.path.replace(/_$/, '').replace(/\//g, '.')}._`
  if (te(path)) {
    return t(path)
  } else {
    return t(path, 'en-US')
  }
}

const getMenuItemSubheader = (meta) => {
  const subheader = meta.menu.subheader
  const path = `_.${meta.type}${subheader}._`

  if (te(path)) {
    return t(path)
  } else {
    return t(path, 'en-US')
  }
}

const getPageStatusText = (status) => {
  if (status === 'draft') {
    return t('menu.status.draft._')
  } else {
    return t('menu.status.empty._')
  }
}

const getPageStatusTextColor = (status) => {
  if (status === 'draft') {
    return 'dark'
  } else {
    return 'white'
  }
}

const getPageStatusColor = (status) => {
  if (status === 'draft') {
    return 'orange'
  } else {
    return 'red'
  }
}

const getPageStatusTooltip = (status) => {
  if (status === 'draft') {
    return t('menu.status.draft.tooltip')
  } else {
    return t('menu.status.empty.tooltip')
  }
}
</script>

<template>
<!-- Menu Separator - Subheader -->
<q-item-section v-if="subitem.meta.menu.subheader">
  <q-item-label class="label subheader" header>
    {{ getMenuItemSubheader(subitem.meta) }}
  </q-item-label>
</q-item-section>

<q-item
  :to="subitem.path + '/overview'"
  :active="subitem.path + subpage === $route.path"
  v-show="founds[subitem.path] || !founds"
>
  <q-item-section side>
    <q-icon v-if="subitem.meta.icon" :name="subitem.meta.icon" />
  </q-item-section>
  <q-item-section>
    {{ getMenuItemLabel(subitem, subindex) }}
  </q-item-section>
  <q-item-section class="page-status" v-if="subitem.meta.status !== 'done'" side>
    <q-badge
      :text-color="getPageStatusTextColor(subitem.meta.status)"
      :color="getPageStatusColor(subitem.meta.status)"
      :label="getPageStatusText(subitem.meta.status)"
    />
    <q-tooltip :hide-delay="3">{{ getPageStatusTooltip(subitem.meta.status) }}</q-tooltip>
  </q-item-section>
</q-item>

<!-- Menu Separator -->
<li v-if="subitem.meta.menu.separator" role="listitem">
  <q-separator
    :class="'separator' + (subitem.meta.menu.separator === true ? '' : subitem.meta.menu.separator)"
    role="separator"
  />
</li>
</template>
