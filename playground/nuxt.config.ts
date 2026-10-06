// The kit's own consumer app: `npm run dev`, the Vitest Nuxt environment and
// the Playwright fixtures all boot this, so it stays on module defaults.
export default defineNuxtConfig({
  modules: ['../src/module'],

  features: { inlineStyles: false },
})
