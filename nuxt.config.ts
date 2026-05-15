import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

const VITE_CONFIG = {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "${resolve('./app/assets/stylesheet/additional.scss').replace(/\\/g, '/')}" as *;
        `,
      },
    },
  },
}

export default defineNuxtConfig({
  modules: [
    // https://github.com/nuxt/icon
    '@nuxt/icon',
    // https://nuxt.com/modules/vee-validate
    '@vee-validate/nuxt',
    // https://nuxt.com/modules/pinia
    '@pinia/nuxt',
    // https://nuxt.com/modules/device
    '@nuxtjs/device',
    resolve('./app/modules/kit/module'),
  ],

  components: {
    dirs: [
      {
        path: resolve('./app/components'),
        pathPrefix: true,
      },
      {
        path: resolve('./app/components/ui'),
        pathPrefix: true,
        prefix: 'm',
        global: true,
      },
    ],
  },

  imports: {
    dirs: [
      resolve('./app/composables/**'),
      resolve('./app/utils/**'),
      resolve('./shared/**'),
      resolve('./app/store/**'),
    ],
  },

  css: [resolve('./app/assets/stylesheet/main.scss')],
  appDir: resolve('./app'),
  features: { inlineStyles: false },

  vite: VITE_CONFIG,

  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['ic'],
    },
  },

  materialKit: {
    themes: [
      { key: 'brown', name: 'Brown', definedInScss: true },
      { key: 'm3', name: 'M3 Baseline', color: '#6750A4' },
      { key: 'green', name: 'Forest', color: '#386A20' },
    ],
  },
})
