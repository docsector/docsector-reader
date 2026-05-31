import { shallowRef } from 'vue'

export const siteFooterOutletElement = shallowRef(null)

export function registerSiteFooterOutlet (element) {
  if (element instanceof HTMLElement) {
    siteFooterOutletElement.value = element
  }
}

export function unregisterSiteFooterOutlet (element) {
  if (siteFooterOutletElement.value === element) {
    siteFooterOutletElement.value = null
  }
}