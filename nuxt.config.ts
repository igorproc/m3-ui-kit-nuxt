import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

const VITE_CONFIG = {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "${resolve('./assets/stylesheet/additional.scss').replace(/\\/g, '/')}" as *;
        `,
      },
    },
  },
}

export default defineNuxtConfig({
  modules: [
    // https://github.com/nuxt/icon
    '@nuxt/icon',
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
      './shared/**',
    ],
  },

  css: [resolve('./assets/stylesheet/main.scss')],
  vite: VITE_CONFIG,
})
