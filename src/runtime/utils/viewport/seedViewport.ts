import { tryUseNuxtApp } from '#app'

export interface Viewport {
  width: number
  height: number
}

interface DeviceFlags {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

/**
 * Deterministic initial viewport for SSR, seeded from the request device class
 * so the first render (and hydration) starts from a plausible size. The client
 * plugin overrides this with the real measured window size after mount.
 *
 * `tryUseNuxtApp` rather than `useNuxtApp`: this is auto-imported into consumer
 * projects, where a call outside a Nuxt context would otherwise throw instead of
 * falling back to the desktop seed.
 */
export function seedViewport(): Viewport {
  const device = tryUseNuxtApp()?.$device as DeviceFlags | undefined

  if (device?.isMobile) return { width: 393, height: 852 }
  if (device?.isTablet) return { width: 992, height: 1180 }
  return { width: 1920, height: 1080 }
}
