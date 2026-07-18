import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

/**
 * Theme flag that is safe to serialize into SSR markup.
 *
 * The static SSR render always serializes the LIGHT tone (the server cannot
 * know a visitor's theme), and Vue's hydration ADOPTS server DOM without
 * patching class/style mismatches — so a component that reads `$q.dark`
 * directly during hydration renders a dark vnode over light DOM and the
 * adopted markup stays light forever.
 *
 * Two-pass rendering solves it: while hydrating, the first client render
 * reports light (matching the server exactly); after mount the flag flips to
 * the real theme, producing a REAL patch that recolors the adopted DOM.
 * Plain SPA loads (no server markup) keep the live value with no extra pass.
 *
 * @returns {import('vue').ComputedRef<boolean>} whether dark mode is active
 */
export function useSsrSafeDark () {
  const $q = useQuasar()

  // ? SPA / dev: no serialized markup to match — live value, zero overhead
  if (typeof window !== 'undefined' && window.__DOCSECTOR_HYDRATING__ !== true) {
    return computed(() => $q.dark.isActive === true)
  }

  // ! Server render AND hydrating client: light on the first pass (mounted
  //   stays false on the server, so both sides serialize the same tone)
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })

  return computed(() => mounted.value && $q.dark.isActive === true)
}
