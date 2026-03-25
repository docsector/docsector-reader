<script setup>
// defineProps is a compiler macro in <script setup>, no import needed
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  }
})

const alertTypes = {
  note: {
    label: 'Note',
    icon: 'info'
  },
  tip: {
    label: 'Tip',
    icon: 'lightbulb'
  },
  important: {
    label: 'Important',
    icon: 'priority_high'
  },
  warning: {
    label: 'Warning',
    icon: 'warning'
  },
  caution: {
    label: 'Caution',
    icon: 'error'
  }
}

const normalizedMessage = computed(() => {
  const value = String(props.message || '').toLowerCase()
  return alertTypes[value] ? value : ''
})

const alertLabel = computed(() => {
  return normalizedMessage.value
    ? alertTypes[normalizedMessage.value].label
    : ''
})

const alertIcon = computed(() => {
  return normalizedMessage.value
    ? alertTypes[normalizedMessage.value].icon
    : ''
})
</script>

<template>
<blockquote :class="['d-page-blockquote', normalizedMessage ? `d-page-blockquote--${normalizedMessage}` : null]">
  <p v-if="alertLabel" class="d-page-blockquote__heading">
    <q-icon :name="alertIcon" size="18px" />
    <strong>{{ alertLabel }}</strong>
  </p>
  <slot />
</blockquote>
</template>
