export const DEFAULT_BREAKPOINTS = {
  'desktop': 1920,
  'desktop-xs': 1200,
  'tablet': 1199,
  'tablet-xs': 768,
  'mobile': 767,
  'mobile-xs': 0,
}

export type BreakpointKey = keyof typeof DEFAULT_BREAKPOINTS
