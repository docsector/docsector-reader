import pages from 'pages'
import boot from 'pages/boot'

const pagesRoutes = []
for (const [path, page] of Object.entries(pages)) {
  const config = page.config
  if (config === null) {
    continue
  }

  const topPage = config.type ?? 'manual'

  // @ Construct children
  const children = [
    {
      path: '',
      redirect: (to) => `${to.path.replace(/\/$/, '')}/overview/`
    },
    {
      path: 'overview',
      component: () => import('components/DSubpage.vue'),
      meta: {
        status: config.status
      }
    }
  ]
  if (config?.subpages?.showcase === true) {
    children.push({
      path: 'showcase',
      component: () => import('components/DSubpage.vue'),
      meta: {
        status: config.status
      }
    })
  }
  if (config?.subpages?.vs === true) {
    children.push({
      path: 'vs',
      component: () => import('components/DSubpage.vue'),
      meta: {
        status: config.status
      }
    })
  }

  // @ Push route to pageRoutes
  pagesRoutes.push({
    path: '/' + topPage + path,
    component: () => import('layouts/DefaultLayout.vue'),
    meta: {
      ...config,
      data: page.data,
      type: topPage
    },
    children
  })
}

const routes = [
  ...pagesRoutes,

  {
    path: '/home',
    alias: '/',
    component: () => import('layouts/DefaultLayout.vue'),
    meta: {
      icon: 'home',
      menu: {},
      status: 'done',
      type: 'home',
      subpages: {
        showcase: false,
        vs: false
      },
      data: {
        'en-US': {
          title: 'Home'
        },
        'pt-BR': {
          title: 'Pagina inicial'
        }
      },
      meta: boot.meta,
      layouts: {
        footer: false,
        submenu: false
      },
      pages: {}
    },
    children: [
      {
        path: '',
        component: () => import('components/DSubpage.vue'),
        meta: {
          icon: 'home',
          menu: 'home'
        }
      }
    ]
  },

  {
    path: '/(.*)*',
    component: () => import('layouts/SystemLayout.vue'),
    meta: {
      menu: {}
    },
    children: [
      {
        path: '',
        component: () => import('pages/404Page.vue')
      }
    ]
  }
]

export default routes
