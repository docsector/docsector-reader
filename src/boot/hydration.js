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
export default boot(() => {
  // ? Server side: nothing to detect
  if (typeof window === 'undefined') {
    return
  }

  const container = document.getElementById('q-app')
  if (container !== null && container.hasChildNodes()) {
    window.__DOCSECTOR_HYDRATING__ = true
  }
})
