import { computed } from 'vue'
import { useRuntimeConfig } from '#app'

import { resolveBreakpoints } from '#kit/utils/viewport/resolveBreakpoints'
import { sortBreakpoints, resolveBandsFromSorted } from '#kit/utils/viewport/bands'
import { useSSRWindowSize } from '#kit/composables/useSSRWindowSize'

/**
 * App-wide breakpoint state, created once by the kit's `material` plugin.
 *
 * The resolved map and its sort order come from the module options, which never
 * change at runtime, so both are computed once here rather than inside the
 * width-dependent computed. Before this lived in the plugin, every consumer of
 * `useBreakpoint()` built its own chain and re-sorted the map on every resize
 * event — N sorts per frame for N consumers.
 */
export function createBreakpoints() {
  const { width } = useSSRWindowSize()

  const custom = (useRuntimeConfig().public?.materialKit?.breakpoints || {}) as Record<string, string | number>
  const breakpoints = resolveBreakpoints(custom)
  const sorted = sortBreakpoints(breakpoints)

  const bands = computed(() => resolveBandsFromSorted(width.value, sorted))

  return {
    /** Resolved kebab-case map (`tablet-xs` → px), shared with the layout engine. */
    breakpoints,
    is: computed(() => bands.value.is),
    more: computed(() => bands.value.more),
    less: computed(() => bands.value.less),
  }
}

export type MaterialBreakpoints = ReturnType<typeof createBreakpoints>
