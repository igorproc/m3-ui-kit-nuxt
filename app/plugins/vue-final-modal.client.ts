import { createVfm } from 'vue-final-modal'

export default defineNuxtPlugin({
  name: 'app:vue-final-model-setup',

  setup(nuxtApp) {
    const vfm = createVfm()
    nuxtApp.vueApp.use(vfm)
  },
})
