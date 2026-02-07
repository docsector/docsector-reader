/*
 * forked from https://github.com/quasarframework/app-extension-qzoom
 * converted from Vue 2 to Vue 3 by Rodrigo de Araujo Vieira
 * author: Jeff Galbraith
 */

import {
  h,
  ref, computed,
  onMounted, onBeforeUnmount
} from 'vue'

import { useColorize } from 'q-colorize-mixin'

import { dom } from 'quasar'
const { offset } = dom

import './QZoom.styl'

// @
export default {
  name: 'QZoom',

  props: {
    backgroundColor: {
      type: String,
      default: 'white'
    },
    restoreOnScroll: Boolean,
    manual: Boolean,
    scale: Boolean,
    initialScale: { type: Number, default: 1.0, validator: v => v >= 0.05 && v <= 10 },
    scaleText: Boolean,
    initialScaleText: { type: Number, default: 100, validator: v => v >= 50 && v <= 500 },
    noCenter: Boolean,
    noWheelScale: Boolean,
    noEscClose: Boolean
  },

  setup (props, { emit, slots }) {
    const vComponent = ref(null)

    const zooming = ref(false)
    const zoomed = ref(false)
    const restoring = ref(false)
    const bgColor = ref('transparent')
    const position = ref(null)
    const scaleValue = ref(1.0)
    const scaleTextValue = ref(100)

    const isTransitioning = computed(() => zooming.value === true || zoomed.value === true || restoring.value === true)
    const isZoomed = computed(() => zoomed.value === true || zooming.value === true)

    const Colorize = useColorize()

    // @ Methods
    const show = () => {
      emit('before-zoom')

      zooming.value = true
      zoomed.value = false
      restoring.value = false

      position.value = getPosition()

      setTimeout(() => {
        bgColor.value = props.backgroundColor
      }, 100)

      setTimeout(() => {
        position.value = getFullScreenPosition()
        zoomed.value = true

        if (!props.restoreOnScroll) {
          addClass(document.body, 'q-zoom__no-scroll')
        }

        if (props.scale && !props.scaleText) {
          setScale(props.initialScale)
        }

        if (props.scaleText && !props.scale) {
          setScaleText(props.initialScaleText)
        }

        emit('zoomed')
      }, 500)
    }

    const hide = () => {
      emit('before-restore')

      restoring.value = true
      zoomed.value = false
      zooming.value = false

      setScale(1.0)
      setScaleText(100)

      position.value = getPosition()

      setTimeout(() => {
        resetTransition()
        removeClass(document.body, 'q-zoom__no-scroll')

        emit('restored')
      }, 400)
    }

    const toggle = () => {
      if (isZoomed.value) {
        hide()
      } else {
        show()
      }
    }

    const setScale = (val) => {
      if (val === scaleValue.value) return

      if (val >= 0.05 && val <= 10) {
        scaleValue.value = val

        emit('scale', scaleValue.value)
      }
    }

    const setScaleText = (val) => {
      if (val === scaleTextValue.value) return

      if (val >= 50 && val <= 500) {
        scaleTextValue.value = val

        emit('scale-text', scaleTextValue.value)
      }
    }

    const addClass = (el, name) => {
      const arr = el.className.split(' ')

      if (arr.indexOf(name) === -1) {
        arr.push(name)
        el.className = arr.join(' ')
      }
    }

    const removeClass = (el, name) => {
      const arr = el.className.split(' ')
      const index = arr.indexOf(name)

      if (index !== -1) {
        arr.splice(index, 1)
        el.className = arr.join(' ')
      }
    }

    const resetTransition = () => {
      zoomed.value = false
      zooming.value = false
      restoring.value = false
      bgColor.value = 'transparent'
      scaleValue.value = 1.0
      scaleTextValue.value = 100
    }

    const onScroll = (e) => {
      if (isZoomed.value && props.restoreOnScroll) {
        hide()

        e.preventDefault()
      }
    }

    const onKeyup = (e) => {
      if (e.key === 'Escape') {
        if (!props.noEscClose) {
          if (isZoomed.value) {
            hide()

            e.preventDefault()
          }
        }
      }
    }

    const getPosition = () => {
      const position = offset(vComponent.value)

      position.left = position.left + 'px'
      position.top = position.top + 'px'
      position.width = vComponent.value.clientWidth + 'px'
      position.height = vComponent.value.clientHeight + 'px'

      return position
    }

    const getFullScreenPosition = () => {
      return { left: 0, top: 0, width: '100%', height: '100%' }
    }

    const wheelEvent = (e) => {
      if (!props.noWheelScale) {
        if (isZoomed.value && props.scale && !props.scaleText) {
          const less = scaleValue.value > 1 ? -0.5 : -0.1
          const more = scaleValue.value > 1 ? 0.5 : 0.1
          const val = (e.wheelDeltaY < 0 ? less : more)

          setScale(scaleValue.value + val)

          e.preventDefault()
        } else if (isZoomed.value && props.scaleText && !props.scale) {
          const val = (e.wheelDeltaY < 0 ? -1 : 1)

          setScaleText(scaleTextValue.value + val)

          e.preventDefault()
        }
      }
    }

    // @ Events
    onMounted(() => {
      document.addEventListener('scroll', onScroll)
      document.addEventListener('keyup', onKeyup)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('scroll', onScroll)
      document.removeEventListener('keyup', onKeyup)
    })

    // @
    const __renderOverlayContent = () => {
      const slot = slots.default

      return h('div', Colorize.setBackgroundColor(props.backgroundColor, {
        class: 'q-zoom__content' +
          (props.noCenter ? ' q-zoom__no-center' : ''),
        style: {
          left: position.value.left,
          top: position.value.top,
          width: position.value.width,
          height: position.value.height,
          transform: props.scale && !props.scaleText && `scale(${scaleValue.value})`,
          fontSize: props.scaleText && !props.scale && `${scaleTextValue.value}%`
        }
      }), [
        slot && slot({ zoomed: isZoomed.value })
      ])
    }

    const __renderOverlay = () => {
      if (!isTransitioning.value) {
        return null
      }

      return h('div', Colorize.setBackgroundColor(bgColor.value, {
        class: 'q-zoom__overlay' +
          (props.manual ? '' : ' q-zoom__zoom-out')
      }), [
        __renderOverlayContent()
      ])
    }

    return () => h('div', {
      class: 'q-zoom' +
        (props.manual ? '' : ' q-zoom__zoom-in'),

      onClick: toggle,
      onWheel: wheelEvent,

      ref: vComponent
    }, [
      slots.default && slots.default({ zoomed: isZoomed.value }),
      __renderOverlay()
    ])
  }
}
