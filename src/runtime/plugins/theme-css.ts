import { watch } from 'vue'
import { defineNuxtPlugin } from '#app'

/**
 * Renders the active palette's CSS and keeps it current.
 *
 * The generator pulls in `@material/material-color-utilities` — a ~20 KB (gzipped)
 * chunk of color science — so it is imported on demand rather than statically. On
 * the server that import is awaited once and the result travels to the client in the
 * payload; a page load that never touches the theme therefore never fetches it.
 *
 * The watch is keyed on `schemeKey`, a string, rather than on the input object: that
 * object is reallocated on every evaluation, so watching it by reference would fire
 * during hydration and pull the chunk in on every page load.
 */
export default defineNuxtPlugin({
  name: 'material-theme-css',
  dependsOn: ['material'],
  async setup(nuxtApp) {
    const theme = nuxtApp.$material.theme

    const render = async () => {
      const [{ generateScheme }, { buildThemeBlocks }] = await Promise.all([
        import('#kit/utils/theme/generateScheme'),
        import('#kit/utils/theme/themeScss'),
      ])

      const { paletteKey, theme: activeTheme, ...options } = theme.schemeInput

      theme.themeCss = buildThemeBlocks(paletteKey, generateScheme(activeTheme, options))
      theme.themeCssKey = theme.schemeKey
      // Only now may `data-palette` name this palette — its block exists.
      theme.committedPalette = paletteKey
    }

    // Never take the page down over a theme: the seed ultimately comes from a cookie,
    // and a render that throws must degrade to "palette not applied", not to a 500.
    const renderSafe = async () => {
      try {
        await render()
      } catch (error) {
        console.warn('[@pr0s1k/primetime-kit] could not render the palette CSS', error)
      }
    }

    // On the server nothing is cached yet, so this always renders. On the client the
    // keys match whatever SSR produced and nothing is imported — unless they differ,
    // which means the cookie changed between render and hydration.
    if (theme.schemeKey !== theme.themeCssKey) {
      await renderSafe()
    }

    if (import.meta.client) {
      watch(() => theme.schemeKey, () => void renderSafe())
    }
  },
})
