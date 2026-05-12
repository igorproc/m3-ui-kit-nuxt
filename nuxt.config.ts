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
    '@vueuse/nuxt',
    './kit/module',
  ],

  components: {
    dirs: [
      {
        path: './components',
        pathPrefix: true,
      },
      {
        path: './components/ui',
        pathPrefix: true,
        prefix: 'm',
      },
    ],
  },

  imports: {
    dirs: [
      './composables/**',
      './utils/**',
      '../shared/**',
      './store/**',
    ],
  },

  css: ['~/assets/stylesheet/main.scss'],
  appDir: './app',
  features: { inlineStyles: false },

  vite: VITE_CONFIG,

  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['ic'],
    },
  },
})
