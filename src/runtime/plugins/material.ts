import { defineNuxtPlugin } from '#app'

import { createMaterialTheme } from '#kit/utils/theme/createMaterialTheme'
import { createBreakpoints } from '#kit/utils/viewport/createBreakpoints'
import type { MaterialThemeController } from '#kit/utils/theme/createMaterialTheme'
import type { MaterialBreakpoints } from '#kit/utils/viewport/createBreakpoints'

/** Everything the kit shares app-wide, injected as `$material`. */
export interface MaterialRuntime {
  theme: MaterialThemeController
  breakpoints: MaterialBreakpoints
}

declare module '#app' {
  interface NuxtApp {
    $material: MaterialRuntime
  }
}

/**
 * Builds the kit's app-wide singletons — one per Nuxt app, which on the server means
 * one per request.
 *
 * They live here rather than being created lazily by a composable for two reasons.
 * Sharing is a correctness requirement, not an optimisation: each `useCookie()` call
 * returns its own ref, so separate instances would only see each other's writes
 * through Nuxt's cross-instance cookie sync — asynchronous on the client, absent on
 * the server. And a plugin body runs inside `nuxtApp._scope`, so Nuxt disposes the
 * cookie watchers, expiry timers and `matchMedia` subscriptions when the app goes
 * away; a lazily-created detached scope had to arrange all of that by hand.
 */
export default defineNuxtPlugin({
  // Named so consumers can order their own plugins with `dependsOn: ['material']`.
  name: 'material',
  setup: () => ({
    provide: {
      material: {
        theme: createMaterialTheme(),
        breakpoints: createBreakpoints(),
      } satisfies MaterialRuntime,
    },
  }),
})
