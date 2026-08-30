import { defineNuxtPlugin, useState } from '#app'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { seedViewport } from '#kit/utils/viewport/seedViewport'

/**
 * Owns the single global resize subscription (via the shared listener registry
 * — no VueUse). Syncs the real window size into the shared `md:viewport` state
 * so every `useSSRWindowSize()` / `useBreakpoint()` consumer reads one source
 * without spawning its own listener. Runs outside a component scope, so the
 * subscription lives for the app's lifetime.
 *
 * The first sync is deferred to `app:suspense:resolve`: plugins run *before*
 * `app.mount()`, so measuring here would hand hydration a viewport the server
 * never saw (the device-class seed) and turn every width-dependent subtree into
 * a hydration mismatch. After hydration the same change is an ordinary patch.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const viewport = useState('md:viewport', seedViewport)

  const sync = () => {
    const { innerWidth: width, innerHeight: height } = window
    const current = viewport.value
    // A resize burst repeats the same size often; skip the write so consumers'
    // band computations are not invalidated for nothing.
    if (current.width === width && current.height === height) return

    viewport.value = { width, height }
  }

  nuxtApp.hook('app:suspense:resolve', sync)
  useGlobalListener('window', 'resize', sync, { passive: true })
  // `orientationchange` fires before the window dimensions are recomputed in
  // several engines, so reading them here would store the pre-rotation size.
  useGlobalListener('window', 'orientationchange', () => requestAnimationFrame(sync), { passive: true })
})
