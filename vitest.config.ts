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

    // `playground/probes` holds temporary Playwright diagnostics outside git, not unit specs.
    exclude: [...configDefaults.exclude, '.claude/**', 'playground/.nuxt/**', 'playground/.output/**', 'playground/probes/**'],

    // Each spec file boots its own Nuxt environment; under the full suite's load the cold start
    // outgrows the 10 s default and unrelated files fail in `beforeAll`.
    hookTimeout: 30_000,

    coverage: {
      enabled: true,
      provider: 'v8',

      reporter: ['html'],

      reportsDirectory: './coverage',
    },

  },
})
