import type { BreakpointFlags } from '#kit/shared/types/props'

const toCamelCase = (str: string) => str.replace(/-([a-z])/g, g => (g[1] ?? '').toUpperCase())

export interface Bands {
  is: BreakpointFlags
  more: BreakpointFlags
  less: BreakpointFlags
}

/** A breakpoint prepared for band computation: runtime name plus its px threshold. */
export interface SortedBreakpoint {
  name: string
  value: number
}

/**
 * Orders breakpoints by threshold and pre-computes their camelCased runtime names.
 *
 * Depends only on the configuration, never on the viewport, so reactive callers
 * must hoist it out of anything that recomputes on width — otherwise every pixel
 * of a resize re-sorts and re-cases the whole map.
 */
export function sortBreakpoints(breakpoints: Record<string, number>): SortedBreakpoint[] {
  return Object.entries(breakpoints)
    .map(([key, value]) => ({ name: toCamelCase(key), value }))
    .sort((a, b) => a.value - b.value)
}

/**
 * Band computation over pre-sorted breakpoints.
 * - `more[name]` — `width > value` (strict)
 * - `less[name]` — `width < value` (strict)
 * - `is[name]`   — active bucket: `prev < width <= value`
 */
export function resolveBandsFromSorted(width: number, sorted: SortedBreakpoint[]): Bands {
  const is: Record<string, boolean> = {}
  const more: Record<string, boolean> = {}
  const less: Record<string, boolean> = {}

  for (let i = 0; i < sorted.length; i++) {
    const bp = sorted[i]
    if (!bp) continue
    const prev = sorted[i - 1]

    const greaterThanPrev = prev ? width > prev.value : true
    const lessThanOrEqual = i === sorted.length - 1 ? true : width <= bp.value

    is[bp.name] = greaterThanPrev && lessThanOrEqual
    more[bp.name] = width > bp.value
    less[bp.name] = width < bp.value
  }

  return {
    is: is as BreakpointFlags,
    more: more as BreakpointFlags,
    less: less as BreakpointFlags,
  }
}
