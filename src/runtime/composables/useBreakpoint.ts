import { useNuxtApp } from '#app'

/**
 * Breakpoint flags for the current viewport, shared app-wide.
 *
 * - `is[name]`   — the active bucket, `prev < width <= value`
 * - `more[name]` — `width > value` (strict)
 * - `less[name]` — `width < value` (strict)
 * - `is.compact | medium | expanded | large | extraLarge` — the M3 window classes over the
 *   ranges `m-layout` carves by (`tablet-xs`, `desktop-xs`, `desktop`). The kit has no 600 or
 *   840 boundary, so `medium` and `expanded` are the same range; see `WindowClassFlags`.
 *
 * Names are camelCased from the configured keys (`tablet-xs` → `tabletXs`). The
 * bands are computed once for the whole application by the `material` plugin, so
 * calling this in many components costs nothing extra.
 */
export function useBreakpoint() {
  const { $material } = useNuxtApp()
  const { is, more, less } = $material.breakpoints

  return {
    is,
    more,
    less,
  }
}
