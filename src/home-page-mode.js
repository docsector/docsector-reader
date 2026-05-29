export const REMOTE_README_HOME_PAGE_MODE = 'remote-readme'

export function usesRemoteReadmeHomeContent ({ pageBase = '', homePageSourceMode = 'local' } = {}) {
  return pageBase === 'home' && homePageSourceMode === REMOTE_README_HOME_PAGE_MODE
}