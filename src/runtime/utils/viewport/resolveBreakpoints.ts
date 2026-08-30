// Relative on purpose: this is imported by `src/module.ts` at build time, where the
// `#kit` alias does not exist yet — the module itself registers it during `setup()`.
import { DEFAULT_BREAKPOINTS } from '../../shared/constants/breakpoints'
import type { BreakpointKey } from '../../shared/constants/breakpoints'

/** Resolved thresholds: the reserved keys are always present, custom ones may be. */
export type ResolvedBreakpoints = Record<BreakpointKey, number> & Record<string, number>

/**
 * Merges user-configured breakpoints (module options / runtime config) over
 * the kit defaults. Reserved keys are overridden; consumer-defined keys are
 * added. Values may arrive as strings — coerced to integer px.
 *
 * The return type keeps the reserved keys non-optional: callers index them directly
 * (`breakpoints['tablet-xs']`) and the project builds with `noUncheckedIndexedAccess`,
 * so a bare `Record<string, number>` would make every such read `number | undefined`.
 */
export function resolveBreakpoints(
  custom: Record<string, string | number> = {},
): ResolvedBreakpoints {
  const merged = { ...DEFAULT_BREAKPOINTS } as ResolvedBreakpoints

  for (const key of Object.keys(custom)) {
    const value = custom[key]
    if (value == null) continue

    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10)
    if (!Number.isNaN(parsed)) merged[key] = parsed
  }

  return merged
}
