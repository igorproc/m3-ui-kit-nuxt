import { createResolver } from '@nuxt/kit'
import type { MaterialKitOptions } from './src/runtime/shared/types/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    // https://github.com/nuxt/icon
    '@nuxt/icon',
    // https://nuxt.com/modules/pinia
    '@pinia/nuxt',
    // https://nuxt.com/modules/device
    '@nuxtjs/device',
    // https://github.com/igorproc/m3-ui-kit-nuxt
    resolve('./app/modules/kit/module'),
  ],

  components: {
    dirs: [
      {
        path: resolve('./src/runtime/components/core'),
        extensions: ['vue'],
        pathPrefix: false,
        prefix: 'core',
      },
      {
        path: resolve('./src/runtime/components/ui'),
        extensions: ['vue'],
        pathPrefix: true,
        prefix: 'm',
        global: true,
      },
    ],
  },

  imports: {
    dirs: [
      resolve('./src/runtime/composables/**'),
      resolve('./src/runtime/utils/**'),
      resolve('./src/runtime/shared/**'),
      resolve('./src/runtime/store/**'),
    ],
  },

  css: [resolve('./src/runtime/assets/stylesheet/main.scss')],

  runtimeConfig: {
    public: {
      materialKit: {} as MaterialKitOptions,
    },
  },

  appDir: resolve('./src/runtime'),
  alias: {
    '#kit': resolve('./src/runtime'),
  },

  build: {
    transpile: ['@material/material-color-utilities'],
  },
  features: { inlineStyles: false },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "${resolve('./src/runtime/assets/stylesheet/additional.scss').replace(/\\/g, '/')}" as *;
        `,
        },
      },
    },
  },

  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['ic'],
    },
  },
})
