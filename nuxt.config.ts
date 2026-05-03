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
    '@vee-validate/nuxt',
    '@vueuse/nuxt',
  ],

  components: {
    dirs: [
      {
        path: './components',
        pathPrefix: true,
      },
      {
        path: './components/ui',
        pathPrefix: false,
        prefix: 'm',
      },
    ],
  },

  imports: {
    dirs: [
      './composables/**',
      './utils/**',
      '../shared/**',
    ],
  },

  css: [resolve('./app/assets/stylesheet/main.scss').replace(/\\/g, '/')],
  appDir: './app',

  features: { inlineStyles: false },

  vite: VITE_CONFIG,
})
