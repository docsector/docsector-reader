<script setup>
import { watch, onMounted, onUpdated } from 'vue'

import useNavigator from '../composables/useNavigator'

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

const { register, index, navigate, selected } = useNavigator()

watch(() => props.value, (val) => {
  selected.value = val
}, { immediate: true })

onMounted(() => {
  register(props.id)
  index(props.id)
})

onUpdated(() => {
  register(props.id)
  index(props.id)
})
</script>

<template>
<h2 :id="id" @click="navigate(id)" v-html="value"></h2>
</template>
