export const DEFAULT_BREAKPOINTS = {
  'desktop': 1920,
  'desktop-xs': 1200,
  'tablet': 1199,
  'tablet-xs': 768,
  'mobile': 767,
  'mobile-xs': 0,
}

/** Reserved breakpoint keys in config/SCSS form (kebab-case). */
export type BreakpointKey = keyof typeof DEFAULT_BREAKPOINTS
