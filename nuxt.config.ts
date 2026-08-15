import { createResolver } from '@nuxt/kit'
import type { MaterialKitOptions } from '#shared/types/kit'

const { resolve } = createResolver(import.meta.url)

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
        path: resolve('./app/components/core'),
        extensions: ['vue'],
        pathPrefix: false,
        prefix: 'core',
      },
      {
        path: resolve('./app/components/ui'),
        extensions: ['vue'],
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

  runtimeConfig: {
    public: {
      materialKit: {} as MaterialKitOptions,
    },
  },

  appDir: resolve('./app'),

  build: {
    // MCU 0.4.0 ships a few extensionless ESM imports. Keep the package in
    // Nuxt's transform pipeline so Node never evaluates those files raw.
    transpile: ['@material/material-color-utilities'],
  },
  features: { inlineStyles: false },

  vite: {
    server: {
      watch: {
        usePolling: true,
      },
      hmr: {
        protocol: 'ws',
        host: String(process.env.HOST) || '0.0.0.0',
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "${resolve('./app/assets/stylesheet/additional.scss').replace(/\\/g, '/')}" as *;
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

  materialKit: {
    defaultTheme: 'monochrome',
    themes: [
      { key: 'classic-m3', name: 'Classic M3', color: '#6750A4' },
      { key: 'tonal-spot', name: 'M3 Tonal', color: '#6750A4', preset: 'tonalSpot' },
      { key: 'neutral', name: 'Forest Mist', color: '#386A20', preset: 'neutral' },
      { key: 'vibrant', name: 'Vibrant Sunset', color: '#FF5722', preset: 'vibrant' },
      { key: 'fidelity', name: 'Fidelity Cyan', color: '#00BCD4', preset: 'fidelity' },
    ],
  },
})
