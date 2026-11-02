import type { ResolvedBreakpoints } from './resolveBreakpoints'

/**
 * M3 window size classes, as flags on `useBreakpoint().is`.
 *
 * They are aliases over the kit's own ranges — the ones `m-layout` carves by —
 * not M3's numbers. The kit has no 600 or 840 boundary: `compact` is the range
 * below `tablet-xs`, `medium` and `expanded` are both the range from `tablet-xs`
 * to `desktop-xs`, `large` runs from `desktop-xs` to `desktop`, `extraLarge`
 * from `desktop`. M3's own boundaries would disagree with the layout: between
 * 600 and 767 M3 says "medium, use a rail" while the layout drops every side
 * zone, so a rail chosen by class would vanish. An inexact name is the smaller
 * harm.
 */
export interface WindowClassFlags {
  compact: boolean
  medium: boolean
  expanded: boolean
  large: boolean
  extraLarge: boolean
}

/** The window classes of a `width` px window under the resolved kit breakpoints. */
export function resolveWindowClass(width: number, breakpoints: ResolvedBreakpoints): WindowClassFlags {
  const tablet = width >= breakpoints['tablet-xs'] && width < breakpoints['desktop-xs']

  return {
    compact: width < breakpoints['tablet-xs'],
    medium: tablet,
    expanded: tablet,
    large: width >= breakpoints['desktop-xs'] && width < breakpoints.desktop,
    extraLarge: width >= breakpoints.desktop,
  }
}
