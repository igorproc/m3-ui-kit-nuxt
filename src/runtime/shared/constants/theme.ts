import type { CookieOptions } from '#app'

export const THEME_DEFINITIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
}

export const THEME_CONTRASTS = {
  STANDARD: 'standard',
  MEDIUM: 'medium',
  HIGH: 'high',
}

/**
 * Every MCU scheme variant the kit accepts, as plain data.
 *
 * Duplicated from `TThemeVariant` on purpose: the runtime validates a cookie against
 * this list, and importing the generator's `VARIANT_MAP` to do it would drag the
 * color utilities back into the static client graph.
 */
export const THEME_VARIANTS = [
  'tonalSpot',
  'neutral',
  'vibrant',
  'expressive',
  'monochrome',
  'fidelity',
  'content',
  'rainbow',
  'fruitSalad',
] as const

/** A palette seed the generator can parse: 3, 6 or 8 hex digits, `#` optional. */
export const HEX_SEED_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** Default semantic seeds, harmonized to each palette when the app doesn't override them. */
export const DEFAULT_SEMANTIC_COLORS = {
  success: '#2e7d32',
  warning: '#ed6c02',
  info: '#0288d1',
}

/** Reserved `data-palette` value used for a runtime-generated custom (HEX) palette. */
export const CUSTOM_PALETTE_KEY = '_custom'

/** Built-in fallback palette key described statically in SCSS. */
export const FALLBACK_PALETTE_KEY = '_m3-fallback'

export const THEME_COOKIE_OPTIONS = {
  watch: 'shallow',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  readonly: false,
} satisfies CookieOptions<string>
