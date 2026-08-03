import { boot } from 'quasar/wrappers'

/**
 * Detect hydration before the app mounts.
 *
 * Boot files run before `app.mount('#q-app')`. When the container already has
 * server-rendered children, the client is about to HYDRATE that markup —
 * components whose initial state is serialized differently on the server
 * (layoutSettled's v-show, the progressive reveal's block count) read this
 * flag to start in the exact state the server rendered, keeping hydration
 * mismatch-free. In a plain SPA load the container is empty and the flag
 * stays unset, preserving the classic first-paint gates.
 */
export default boot(({ router }) => {
  // ? Server side: nothing to detect
  if (typeof window === 'undefined') {
    return
  }

  // ? The app is booting — a previous stale-entry reload (see the inline
  //   recovery script in quasar.factory.js) is resolved; re-arm the guard.
  //   The BOOTED flag hands post-boot resource failures over to
  //   setupChunkReload — the inline script must not react once the app runs.
  window.__DOCSECTOR_BOOTED__ = true
  try {
    window.sessionStorage.removeItem('docsector.entry.reload')
  } catch {
    // Storage unavailable (private mode restrictions) — guard stays armed
  }

  // ? Drop the recovery cache-bust param so it never leaks into copied URLs.
  //   Through the router AFTER it settles — vue-router captures the URL at
  //   creation and rewrites history on the initial navigation, so a bare
  //   history.replaceState here would be resurrected.
  router?.isReady?.().then(() => {
    const current = router.currentRoute.value
    if (current?.query?.['docsector-stale'] === undefined) return

    const query = { ...current.query }
    delete query['docsector-stale']
    router.replace({ query, hash: current.hash }).catch(() => {})
  }).catch(() => {})

  const container = document.getElementById('q-app')
  if (container !== null && container.hasChildNodes()) {
    window.__DOCSECTOR_HYDRATING__ = true
  }
})
