import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

import { loadRouteSources } from '../i18n/sources'
import { setupChunkReload } from '../composables/useUpdateCheck'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.config.js instead!
    // quasar.config.js -> build -> vueRouterMode
    // quasar.config.js -> build -> publicPath
    history: createHistory(process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE)
  })

  // Lazy page sources: merge the target page's markdown (every locale) into
  // vue-i18n before the page renders. No-op when sources were bundled eagerly.
  Router.beforeResolve(async (to) => {
    await loadRouteSources(to.matched[0]?.meta)
  })

  // After a redeploy, hashed chunks of the bundle a stale tab is running no
  // longer exist — lazy route imports reject. Recover with a full-page reload
  // to the intended route instead of failing the navigation silently.
  setupChunkReload({ router: Router })

  return Router
})
