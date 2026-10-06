import { fileURLToPath } from 'node:url'
import { configDefaults } from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  resolve: {
    alias: {
      '#kit': fileURLToPath(new URL('./src/runtime', import.meta.url)),
    },
  },

  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./playground', import.meta.url)),
      },
    },

    exclude: [...configDefaults.exclude, '.claude/**', 'playground/.nuxt/**', 'playground/.output/**'],

    coverage: {
      enabled: true,
      provider: 'v8',

      reporter: ['html'],

      reportsDirectory: './coverage',
    },

  },
})
