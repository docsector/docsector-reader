import { scroll } from 'quasar'

// : Center the active menu item inside the sidebar's scroll area. Pure DOM on
//   purpose: under SSR the menu markup is server-rendered and DMenu only
//   hydrates on interaction, so the on-load scroll (DefaultLayout) must work
//   on the un-hydrated markup without waking the component. DMenu reuses the
//   same routine after route changes.
export function scrollMenuToActive (duration = 300) {
  const menu = document.getElementById('menu')
  if (!menu) {
    return
  }

  const menuItemActive = (menu.getElementsByClassName('q-router-link--active'))[0]
  if (!menuItemActive || typeof menuItemActive !== 'object') {
    return
  }

  // ? hidden drawer (mobile overlay closed) — offsets are meaningless there
  if (menuItemActive.offsetParent === null) {
    return
  }

  const offsetTop1 = menuItemActive.closest('.menu-list-expansion')?.offsetTop ?? 0
  const offsetTop2 = menuItemActive.offsetTop

  const innerHeightBy2 = window.innerHeight / 2

  const searchBarHeight = 50
  let expansionHeaderHeight = 0
  if (offsetTop1 > 0) {
    expansionHeaderHeight = 45
  }
  const fixedHeight = searchBarHeight + expansionHeaderHeight

  const target = scroll.getScrollTarget(menuItemActive)
  const offset = (offsetTop1 + offsetTop2) - innerHeightBy2 + fixedHeight

  if (offset > 0) {
    scroll.setVerticalScrollPosition(target, offset, duration)
  }
}
