import { computed, onMounted, ref, watch } from 'vue'

import {
  buildFeedbackPayload,
  buildFeedbackStorageKey,
  readStoredRating,
  sendFeedback,
  storeRating
} from '../feedback/client.js'

/**
 * Page feedback vote state for DPageFeedback.
 *
 * `target` is a ref of `{ path, locale, version }` — one vote per page, locale
 * and docs version. localStorage holds the vote the endpoint has *recorded*;
 * `rating` is the vote the reader sees, which may be ahead of it after a
 * failed send. Every request names the recorded vote as `previous`, so the
 * endpoint cancels exactly what it counted.
 *
 * `storage` / `fetcher` default to localStorage / fetch (injectable for specs).
 */
export function usePageFeedback (target, { storage, fetcher } = {}) {
  const storageKey = computed(() => buildFeedbackStorageKey(target.value))

  const rating = ref(null)
  const pending = ref(false)

  // ? Read after mount only — prerendered markup never depends on storage —
  //   and again whenever the target changes (client-side navigation, locale)
  const restore = () => {
    rating.value = readStoredRating(storageKey.value, storage)
  }
  onMounted(restore)
  watch(storageKey, restore)

  // : picks `value`; picking the shown vote again cancels it. Resolves true
  //   once the endpoint has recorded the change (or nothing needed sending).
  const vote = async (value) => {
    if (pending.value) return false

    const key = storageKey.value
    const next = rating.value === value ? null : value
    const previous = readStoredRating(key, storage)

    rating.value = next

    // ? the endpoint already holds `next` (a retry after a failed switch, or
    //   cancelling a vote that was never recorded)
    if (next === previous) return true

    pending.value = true
    try {
      const accepted = await sendFeedback(buildFeedbackPayload({ ...target.value, rating: next, previous }), fetcher)
      // ? persisted only once recorded — a failed send leaves storage on the
      //   endpoint's state, so the next request still cancels the right vote
      if (accepted) {
        storeRating(key, next, storage)
      }

      return accepted
    } finally {
      pending.value = false
    }
  }

  return { rating, pending, vote }
}
