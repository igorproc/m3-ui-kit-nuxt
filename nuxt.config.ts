import { createResolver } from '@nuxt/kit'
import type { MaterialKitOptions } from './src/runtime/shared/types/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    // https://github.com/igorproc/m3-ui-kit-nuxt
    resolve('./src/module'),
  ],

  runtimeConfig: {
    public: {
      materialKit: {} as MaterialKitOptions,
    },
  },

  features: { inlineStyles: false },
})
