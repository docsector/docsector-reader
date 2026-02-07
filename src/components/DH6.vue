<script setup>
import { watch } from 'vue'

import useNavigator from 'src/composables/useNavigator'

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  value: {
    type: String,
    required: true
  }
})

const { navigate, selected } = useNavigator()

watch(() => props.value, (val) => {
  selected.value = val
}, { immediate: true })
</script>

<template>
<h6 :id="id" @click="navigate(id)" v-html="value"></h6>
</template>
