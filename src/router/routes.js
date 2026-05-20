import { pageEntries, versions } from 'virtual:docsector-books'
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

const versionPrefixes = (versions || [])
  .map(version => normalizeRoutePath(version?.routePrefix || ''))
  .filter(prefix => prefix !== '/')

const linkHasVersionPrefix = (linkTo) => {
  const normalized = normalizeRoutePath(linkTo)
  return versionPrefixes.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`))
}

const normalizeVersionedInternalLink = (linkTo, versionPrefix = '') => {
  const normalized = normalizeInternalLink(linkTo)
  const prefix = normalizeRoutePath(versionPrefix)

  if (prefix === '/' || linkHasVersionPrefix(normalized)) {
    return normalized
  }

  return normalizeRoutePath(`${prefix}${normalized}`)
}

const buildSourcePathBase = (entry, book, path) => {
  return [entry?.sourceRoot, `${book}${path}`]
    .filter(Boolean)
    .map(segment => String(segment).replace(/^\/+|\/+$/g, ''))
    .join('/')
}

const routeConfigByPath = new Map()
for (const entry of pageEntries || []) {
  const config = entry?.page?.config
  if (config === null) {
    continue
  }

  const topPage = config?.book ?? config?.type ?? entry?.book ?? 'manual'
  const routePath = normalizeRoutePath(`${entry?.versionPrefix || ''}/${topPage}${entry?.pagePath || ''}`)

  routeConfigByPath.set(routePath, config || {})
}

const pagesRoutes = []
for (const entry of pageEntries || []) {
  const path = entry?.pagePath || ''
  const page = entry?.page || {}
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

  const topPage = config.book ?? config.type ?? entry?.book ?? 'manual'
  const routePath = normalizeRoutePath(`${entry?.versionPrefix || ''}/${topPage}${path}`)
  const hasInternalLink = typeof config?.link?.to === 'string' && config.link.to.trim().length > 0
  const internalLinkTo = hasInternalLink ? normalizeVersionedInternalLink(config.link.to, entry?.versionPrefix || '') : null
  const linkedConfig = hasInternalLink
    ? routeConfigByPath.get(resolveInternalLinkBasePath(internalLinkTo))
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
    path: routePath,
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
      type: topPage,
      version: entry.version,
      versionLabel: entry.versionLabel,
      versionCurrent: entry.versionCurrent,
      versionPrefix: entry.versionPrefix || '',
      sourceRoot: entry.sourceRoot || '',
      sourcePathBase: buildSourcePathBase(entry, topPage, path),
      pagePath: path,
      i18nSegments: entry.i18nSegments || [topPage, ...String(path).replace(/^\//, '').split('/').filter(Boolean)],
      menuGroupPath: String(path).replace(/^\//, '').split('/').filter(Boolean)[0] || '',
      unversionedPath: entry.unversionedPath || `/${topPage}${path}`
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
