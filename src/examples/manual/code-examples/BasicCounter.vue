<template>
  <div class="basic-counter-example q-pa-md">
    <q-card class="basic-counter-example__card" flat bordered>
      <q-card-section>
        <div class="text-subtitle2 text-grey-7">Interactive preview</div>
        <div class="basic-counter-example__value">{{ count }}</div>
        <div class="text-body2 text-grey-7">{{ countLabel }}</div>
      </q-card-section>

      <q-separator></q-separator>

      <q-card-actions align="right">
        <q-btn flat color="primary" label="Reset" @click="reset"></q-btn>
        <q-btn unelevated color="primary" label="Increment" @click="increment"></q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  setup () {
    const count = ref(0)
    const countLabel = computed(() => count.value === 1 ? 'click recorded' : 'clicks recorded')

    function increment () {
      count.value++
    }

    function reset () {
      count.value = 0
    }

    return {
      count,
      countLabel,
      increment,
      reset
    }
  }
}
</script>

<style scoped>
.basic-counter-example {
  display: flex;
  justify-content: center;
}

.basic-counter-example__card {
  max-width: 360px;
  width: 100%;
}

.basic-counter-example__value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  margin: 12px 0 6px;
}
</style>