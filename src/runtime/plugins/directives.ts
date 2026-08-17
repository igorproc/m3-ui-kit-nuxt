import { defineNuxtPlugin } from '#app'

import { clickOutside } from '../directives/click-outside'
import { ripple } from '../directives/ripple'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', clickOutside)
  nuxtApp.vueApp.directive('ripple', ripple)
})
