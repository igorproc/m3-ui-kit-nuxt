import { defineNuxtPlugin } from '#app'

interface ClickOutsideElement extends HTMLElement {
  _clickOutside?: (event: Event) => void
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', {
    mounted(el: ClickOutsideElement, binding) {
      el._clickOutside = (event: Event) => {
        // Check if the click was outside the element and its children
        if (!(el === event.target || el.contains(event.target as Node))) {
          if (typeof binding.value === 'function') {
            binding.value(event)
          }
        }
      }
      // Use capture to ensure we catch it before other handlers if needed
      document.addEventListener('click', el._clickOutside, true)
    },
    unmounted(el: ClickOutsideElement) {
      if (el._clickOutside) {
        document.removeEventListener('click', el._clickOutside, true)
        delete el._clickOutside
      }
    },
    getSSRProps() {
      // Directives that only work on the client should return empty props for SSR
      return {}
    },
  })
})
