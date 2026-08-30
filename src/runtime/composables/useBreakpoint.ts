import { useNuxtApp } from '#app'

/**
 * Breakpoint flags for the current viewport, shared app-wide.
 *
 * - `is[name]`   — the active bucket, `prev < width <= value`
 * - `more[name]` — `width > value` (strict)
 * - `less[name]` — `width < value` (strict)
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
