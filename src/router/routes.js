import { books } from 'virtual:docsector-books'
import boot from 'pages/boot'

const normalizeInternalLink = (linkTo) => {
  const normalized = String(linkTo || '').trim()
  if (normalized.length === 0) {
    return '/'
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

const normalizeRoutePath = (path) => {
  const normalized = String(path || '')
    .trim()
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '')

  if (normalized === '') {
    return '/'
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

const resolveInternalLinkBasePath = (linkTo) => {
  const normalized = normalizeInternalLink(linkTo)
  const withoutTrailingSlash = normalized.replace(/\/+$/, '')
  const withoutSubpage = withoutTrailingSlash.replace(/\/(overview|showcase|vs)$/i, '')

  return normalizeRoutePath(withoutSubpage || '/')
}

const routeConfigByPath = new Map()
for (const [bookId, book] of Object.entries(books || {})) {
  const bookRoutes = book?.routes || {}

  for (const [path, page] of Object.entries(bookRoutes)) {
    const config = page?.config
    if (config === null) {
      continue
    }

    const topPage = config?.book ?? config?.type ?? bookId ?? 'manual'
    const routePath = normalizeRoutePath('/' + topPage + path)

    routeConfigByPath.set(routePath, config || {})
  }
}

const pagesRoutes = []
for (const [bookId, book] of Object.entries(books || {})) {
  const bookRoutes = book?.routes || {}

  for (const [path, page] of Object.entries(bookRoutes)) {
    const rawConfig = page.config
    if (rawConfig === null) {
      continue
    }

    const config = rawConfig || {}
    const menu = (typeof config.menu === 'object' && config.menu !== null) ? config.menu : {}
    const subpages = {
      showcase: config?.subpages?.showcase === true,
      vs: config?.subpages?.vs === true
    }

    const topPage = config.book ?? config.type ?? bookId ?? 'manual'
    const hasInternalLink = typeof config?.link?.to === 'string' && config.link.to.trim().length > 0
    const internalLinkTo = hasInternalLink ? normalizeInternalLink(config.link.to) : null
    const linkedConfig = hasInternalLink
      ? routeConfigByPath.get(resolveInternalLinkBasePath(config.link.to))
      : null
    const icon = config.icon ?? linkedConfig?.icon
    const status = typeof config.status === 'string'
      ? config.status
      : (typeof linkedConfig?.status === 'string' ? linkedConfig.status : 'done')

    // @ Construct children
    const children = hasInternalLink
      ? [
          {
            path: '',
            redirect: () => internalLinkTo
          },
          {
            path: 'overview',
            redirect: () => internalLinkTo
          }
        ]
      : [
          {
            path: '',
            redirect: (to) => `${to.path.replace(/\/$/, '')}/overview/`
          },
          {
            path: 'overview',
            component: () => import('components/DSubpage.vue'),
            meta: {
              status
            }
          }
        ]

    if (!hasInternalLink && subpages.showcase === true) {
      children.push({
        path: 'showcase',
        component: () => import('components/DSubpage.vue'),
        meta: {
          status
        }
      })
    }
    if (!hasInternalLink && subpages.vs === true) {
      children.push({
        path: 'vs',
        component: () => import('components/DSubpage.vue'),
        meta: {
          status
        }
      })
    }

    // @ Push route to pageRoutes
    pagesRoutes.push({
      path: '/' + topPage + path,
      component: () => import('layouts/DefaultLayout.vue'),
      meta: {
        ...config,
        icon,
        status,
        menu,
        subpages,
        data: page.data,
        book: topPage,
        // legacy compatibility
        type: topPage
      },
      children
    })
  }
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
      book: 'home',
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
