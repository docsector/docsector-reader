import { computed } from 'vue'
import { useQuasar } from 'quasar'

/**
 * Screen width that is safe to serialize into SSR markup.
 *
 * Quasar's Screen plugin only measures after `onSSRHydrated` fires, so during
 * the server render AND the hydration pass `$q.screen.width` is 0 — every
 * `$q.screen.lt.*` check then reads as "smallest viewport" and serializes
 * mobile-flavored classes that desktop immediately re-lays out (CLS). Assume
 * desktop (1440) until the first real measurement: the static render targets
 * desktop and the pre-hydration CSS in app.sass corrects small screens.
 *
 * Quasar breakpoints for reference: sm = 600, md = 1024, lg = 1440.
 *
 * @returns {import('vue').ComputedRef<number>} the measured (or assumed) width
 */
export function useSsrSafeScreenWidth () {
  const $q = useQuasar()

  return computed(() => $q.screen.width || 1440)
}
