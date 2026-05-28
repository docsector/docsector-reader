<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'DBlockStepper'
})

const props = defineProps({
  steps: {
    type: Array,
    default: () => []
  }
})

const { t } = useI18n()
const currentStep = ref(1)
const isFinished = ref(false)
const stepCount = computed(() => props.steps.length)

watch(stepCount, (count) => {
  if (count < 1) {
    currentStep.value = 1
    isFinished.value = false
    return
  }

  if (currentStep.value > count) {
    currentStep.value = count
  }
}, { immediate: true })

const isLastStep = (index) => index === props.steps.length - 1
const hasDefaultIcon = (step) => typeof step?.icon === 'string' && step.icon !== '' && step.icon !== 'none'
const stepPrefix = (step, index) => hasDefaultIcon(step) ? void 0 : String(index + 1)
const isStepDone = (index) => isFinished.value || currentStep.value > index + 1

const goToStep = (stepNumber) => {
  if (stepNumber < 1 || stepNumber > props.steps.length) {
    return
  }

  isFinished.value = false
  currentStep.value = stepNumber
}

const finishStepper = () => {
  isFinished.value = true
  currentStep.value = null
}
</script>

<template>
<div v-if="steps.length" class="d-stepper">
  <q-stepper
    v-model="currentStep"
    vertical
    animated
    flat
    bordered
    header-nav
    color="primary"
    active-color="primary"
    done-color="positive"
    inactive-color="grey-6"
    class="d-stepper__shell"
  >
    <q-step
      v-for="(step, index) in steps"
      :key="`${step.title}-${index}`"
      :name="index + 1"
      :title="step.title"
      :prefix="stepPrefix(step, index)"
      :icon="step.icon || void 0"
      :active-icon="step.activeIcon || step.icon || void 0"
      :done-icon="step.doneIcon || step.icon || void 0"
      :error-icon="step.errorIcon || step.icon || void 0"
      :done="isStepDone(index)"
      header-class="d-stepper__step-header"
      class="d-stepper__step"
    >
      <div class="d-stepper__body">
        <slot :step="step" :index="index" />
      </div>

      <q-stepper-navigation class="d-stepper__navigation">
        <q-btn
          v-if="!isLastStep(index)"
          color="primary"
          no-caps
          unelevated
          :label="t('page.stepper.continue')"
          @click="goToStep(index + 2)"
        />

        <q-btn
          v-else
          color="positive"
          no-caps
          unelevated
          :label="t('page.stepper.finish')"
          @click="finishStepper"
        />

        <q-btn
          v-if="index > 0"
          unelevated
          no-caps
          class="d-stepper__back d-stepper__secondary-action"
          :label="t('page.stepper.back')"
          @click="goToStep(index)"
        />
      </q-stepper-navigation>
    </q-step>
  </q-stepper>
</div>
</template>

<style lang="sass">
body.body--light
  --d-stepper-shell-bg: #fffdfa
  --d-stepper-shell-border: rgba(123, 94, 45, 0.16)
  --d-stepper-shell-shadow: rgba(94, 73, 37, 0.08)
  --d-stepper-header-bg: rgba(255, 242, 212, 0.32)
  --d-stepper-divider: rgba(123, 94, 45, 0.14)
  --d-stepper-text-muted: #5f6772
  --d-stepper-secondary-bg: rgba(123, 94, 45, 0.12)
  --d-stepper-secondary-bg-hover: rgba(123, 94, 45, 0.18)
  --d-stepper-secondary-text: #705420

body.body--dark
  --d-stepper-shell-bg: rgba(255, 248, 235, 0.04)
  --d-stepper-shell-border: rgba(255, 235, 194, 0.12)
  --d-stepper-shell-shadow: rgba(0, 0, 0, 0.28)
  --d-stepper-header-bg: rgba(255, 240, 210, 0.04)
  --d-stepper-divider: rgba(255, 235, 194, 0.08)
  --d-stepper-text-muted: rgba(255, 255, 255, 0.72)
  --d-stepper-secondary-bg: rgba(255, 235, 194, 0.1)
  --d-stepper-secondary-bg-hover: rgba(255, 235, 194, 0.16)
  --d-stepper-secondary-text: #f4ddb0

.d-stepper
  margin: 1.5rem 0

.d-stepper__shell
  border-radius: 20px
  overflow: hidden
  background: var(--d-stepper-shell-bg)
  border-color: var(--d-stepper-shell-border)
  box-shadow: 0 16px 36px var(--d-stepper-shell-shadow)

.d-stepper__shell.q-stepper--vertical
  .q-stepper__header
    background: var(--d-stepper-header-bg)

  .q-stepper__tab
    min-height: 72px

  .q-stepper__step-inner
    border-top: 1px solid var(--d-stepper-divider)

  .q-stepper__title
    font-size: 1rem
    font-weight: 700
    line-height: 1.45

  .q-stepper__caption
    color: var(--d-stepper-text-muted)

.d-stepper__step-header
  font-weight: 700

.d-stepper__body
  min-width: 0
  padding-top: 0.85rem

  > :first-child
    margin-top: 0

  > :last-child
    margin-bottom: 0

.d-stepper__navigation
  display: flex
  flex-wrap: wrap
  gap: 0.75rem
  margin-top: 1rem

.d-stepper__back
  margin-left: 0 !important

.d-stepper__secondary-action
  background: var(--d-stepper-secondary-bg) !important
  color: var(--d-stepper-secondary-text) !important

  &:hover,
  &:focus-visible
    background: var(--d-stepper-secondary-bg-hover) !important

@media (max-width: 599px)
  .d-stepper__shell.q-stepper--vertical
    .q-stepper__tab
      min-height: 64px

    .q-stepper__title
      font-size: 0.97rem

  .d-stepper__navigation
    gap: 0.55rem
</style>