import { computed } from 'vue'
import { useState } from '#app'
import { seedViewport } from '#kit/utils/viewport/seedViewport'

/**
 * Shared, SSR-safe viewport `{ width, height }` as refs. Backed by a single
 * per-request `useState('md:viewport')`, seeded from the request device class
 * and updated on the client by the `viewport.client` plugin's single resize
 * listener — so consumers never spawn their own listener.
 */
export function useSSRWindowSize() {
  const viewport = useState('md:viewport', seedViewport)

  const width = computed(() => viewport.value.width)
  const height = computed(() => viewport.value.height)

  return { width, height }
}
