import { computed } from 'vue'
import { useRuntimeConfig } from '#app'
import { DEFAULT_BREAKPOINTS, type BreakpointKey } from '~~/shared/constants/breakpoints'
import { resolveBreakpoints } from '~~/shared/utils/resolveBreakpoints'

export function useBreakpoint() {
  const { width } = useSSRWindowSize()
  const runtimeConfig = useRuntimeConfig()

  const customBreakpoints = (runtimeConfig.public?.materialKit?.breakpoints || {}) as Partial<Record<BreakpointKey, string | number>>

  // Единый merge с лейаут-движком (createLayout) — shared/utils/resolveBreakpoints
  const breakpoints = computed(() => resolveBreakpoints(customBreakpoints))

  const sortedBreakpoints = computed(() => {
    return Object.entries(breakpoints.value)
      .map(([key, value]) => ({ key: key as BreakpointKey, value }))
      .sort((a, b) => a.value - b.value)
  })

  const toCamelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase())

  const is = computed(() => {
    const sorted = sortedBreakpoints.value
    const currentWidth = width.value
    const result = {} as Record<string, boolean>

    for (let i = 0; i < sorted.length; i++) {
      const bp = sorted[i]
      const prevBp = sorted[i - 1]

      const isGreaterThanPrev = prevBp ? currentWidth > prevBp.value : true
      const isLessThanOrEqual = i === sorted.length - 1 ? true : currentWidth <= bp.value

      result[toCamelCase(bp.key)] = isGreaterThanPrev && isLessThanOrEqual
    }

    return result
  })

  const more = computed(() => {
    const currentWidth = width.value
    const result = {} as Record<string, boolean>

    for (const key of Object.keys(DEFAULT_BREAKPOINTS) as BreakpointKey[]) {
      result[toCamelCase(key)] = currentWidth > breakpoints.value[key]
    }

    return result
  })

  const less = computed(() => {
    const currentWidth = width.value
    const result = {} as Record<string, boolean>

    for (const key of Object.keys(DEFAULT_BREAKPOINTS) as BreakpointKey[]) {
      result[toCamelCase(key)] = currentWidth < breakpoints.value[key]
    }

    return result
  })

  return {
    is,
    more,
    less,
  }
}
