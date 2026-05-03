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

  features: { inlineStyles: false },

  vite: VITE_CONFIG,
})
