import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  resolve: {
    alias: {
      '#kit': fileURLToPath(new URL('./src/runtime', import.meta.url)),
    },
  },

  test: {
    environment: 'nuxt',

    coverage: {
      enabled: true,
      provider: 'v8',

      reporter: ['html'],

      reportsDirectory: './.nuxt/tests-coverage',
    },

  },
})
