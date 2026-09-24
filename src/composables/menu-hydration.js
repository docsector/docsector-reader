import { hydrateOnInteraction } from 'vue'

// ! How long the first navigation may wait for the menu chunk — past it, the
//   navigation goes on and the menu falls back to hydrating on interaction
export const MENU_WAIT_MS = 5000

/**
 * Lazy hydration of the server-rendered sidebar menu.
 *
 * The menu hydrates on the first interaction with it — or right before the
 * first client-side navigation (a book tab, previous/next, a content link),
 * whichever comes first. Its server markup describes the route it was
 * rendered for: hydrating after a navigation would leave the old route's tree
 * on screen until an interaction, and even then keep its hrefs and classes,
 * since Vue never patches attributes while hydrating. So the navigation guard
 * hydrates while the route still matches the markup, and the menu then
 * follows the navigation reactively.
 *
 * Vue installs a hydration strategy only once the component's chunk has
 * loaded, so the guard is registered up front: a navigation that starts
 * before the chunk arrives waits for it (or for its failure) before going on,
 * never longer than MENU_WAIT_MS. When the server markup has left the page —
 * the drawer re-renders its menu on the client below 1024px — the menu is
 * already live and nothing is waited for.
 *
 * @param {Object} router - The app router
 * @param {Object} options
 * @param {Array<string>} options.interactions - DOM events that hydrate the menu
 * @param {Function} options.loader - The menu component loader (dynamic import)
 * @param {Element|null} options.markup - The server-rendered menu element this layout hydrates, or null
 * @returns {{ loader: Function, strategy: Function, settle: Function, dispose: Function }}
 *   The loader and hydration strategy for defineAsyncComponent, the check to
 *   run once the layout has mounted, and the cleanup for its unmount
 */
export function createMenuHydration (router, { interactions = [], loader, markup = null } = {}) {
  const hydrating = markup !== null

  // * Metadata
  let hydrate = null
  let hydrated = !hydrating
  let loading = false
  let teardown = null
  let install = null
  const installed = new Promise((resolve) => {
    install = resolve
  })

  // @ hydrate once, then drop the other trigger — the flag also covers a
  //   racing navigation that snapshotted the guard before it was removed
  const run = () => {
    if (hydrated) {
      return
    }

    hydrated = true
    removeGuard()
    teardown?.()

    // ? a failed chunk leaves nothing to hydrate
    if (hydrate === null) {
      return
    }

    // ? a render error must not cancel the navigation that woke the menu
    try {
      hydrate()
    } catch (error) {
      console.error(error)
    }
  }

  // : true once the strategy is installed, false after MENU_WAIT_MS
  const wait = () => {
    let timer = null
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), MENU_WAIT_MS)
    })

    return Promise.race([installed.then(() => true), timeout]).finally(() => clearTimeout(timer))
  }

  // ? same-path navigations (hash, query) keep the markup valid
  const removeGuard = hydrating
    ? router.beforeEach(async (to, from) => {
      if (to.path === from.path) {
        return
      }

      // ? the server markup is gone (re-rendered on the client): nothing to
      //   hydrate, nothing to wait for
      if (!markup.isConnected) {
        run()
        return
      }

      // ? never hold a navigation hostage to a stalled chunk
      if (await wait()) {
        run()
      } else {
        removeGuard()
      }
    })
    : () => {}

  // :
  return {
    loader: () => {
      loading = true

      return loader().catch((error) => {
        install()
        throw error
      })
    },
    strategy: (hydrateMenu, forEachElement) => {
      hydrate = hydrateMenu
      install()
      teardown = hydrateOnInteraction(interactions)(run, forEachElement)

      // : unmounted before hydrating — leave no listener or guard behind
      return () => {
        removeGuard()
        teardown?.()
      }
    },
    // ? once the layout has mounted, a hydrating menu has already asked for
    //   its chunk; if none did (no sidebar on this page), nothing will ever
    //   install the strategy, so the guard must not wait for it
    settle: () => {
      if (!loading || !markup?.isConnected) {
        run()
      }
    },
    dispose: () => {
      removeGuard()
    }
  }
}
