import { DEFAULT_BREAKPOINTS, type BreakpointKey } from '#kit/shared/constants/breakpoints'

/**
 * Merges user-configured breakpoints (module options / runtime config) over
 * the kit defaults. Values may arrive as strings — coerced to integer px.
 */
export function resolveBreakpoints(
  custom: Partial<Record<BreakpointKey, string | number>> = {},
): Record<BreakpointKey, number> {
  const merged = { ...DEFAULT_BREAKPOINTS }

  for (const key of Object.keys(custom) as BreakpointKey[]) {
    const value = custom[key]
    if (value == null) continue

    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10)
    if (!Number.isNaN(parsed)) merged[key] = parsed
  }

  return merged
}
