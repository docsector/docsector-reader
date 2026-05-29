<template>
  <div class="inline-notice-example q-pa-md">
    <q-banner rounded class="inline-notice-example__banner">
      <template #avatar>
        <q-icon name="tips_and_updates" color="primary"></q-icon>
      </template>

      <div class="text-weight-medium">{{ title }}</div>
      <div class="text-body2">{{ message }}</div>

      <template #action>
        <q-btn flat color="primary" label="Dismiss" @click="dismiss"></q-btn>
      </template>
    </q-banner>

    <div v-if="dismissed" class="inline-notice-example__status text-caption">
      The notice was dismissed.
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup () {
    const title = 'Documentation tip'
    const message = 'Use expanded examples when the source code is part of the lesson.'
    const dismissed = ref(false)

    function dismiss () {
      dismissed.value = true
    }

    return {
      dismissed,
      dismiss,
      message,
      title
    }
  }
}
</script>

<style scoped>
.inline-notice-example {
  display: grid;
  gap: 10px;
}

.inline-notice-example__banner {
  background: rgba(25, 118, 210, 0.08);
  border: 1px solid rgba(25, 118, 210, 0.18);
}

.inline-notice-example__status {
  color: #607d68;
  padding-left: 8px;
}
</style>