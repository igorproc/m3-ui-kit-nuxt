import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
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
