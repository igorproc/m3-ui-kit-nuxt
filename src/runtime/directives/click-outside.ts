import type { ObjectDirective } from 'vue'

type OutsideHandler = (event: Event) => void

interface ClickOutsideElement extends HTMLElement {
  _clickOutside?: (event: Event) => void
  _clickOutsideHandler?: unknown
}

export const clickOutside: ObjectDirective<ClickOutsideElement> = {
  mounted(el, binding) {
    el._clickOutsideHandler = binding.value
    // One listener for the element's life; it reads the handler bound now, so
    // a re-render that passes a new function is followed (`updated`).
    el._clickOutside = (event: Event) => {
      if (el === event.target || el.contains(event.target as Node)) return

      const handler = el._clickOutsideHandler
      if (typeof handler === 'function') (handler as OutsideHandler)(event)
    }
    // Use capture to ensure we catch it before other handlers if needed
    document.addEventListener('click', el._clickOutside, true)
  },
  updated(el, binding) {
    el._clickOutsideHandler = binding.value
  },
  unmounted(el) {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside, true)
      delete el._clickOutside
    }
    delete el._clickOutsideHandler
  },
  getSSRProps() {
    // Directives that only work on the client should return empty props for SSR
    return {}
  },
}
