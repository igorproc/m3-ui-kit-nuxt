import type { CookieOptions } from '#app'

export const THEME_DEFINITIONS = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const THEME_CONTRASTS = {
  MEDIUM: 'medium',
}

export const THEME_COOKIE_OPTIONS = {
  watch: 'shallow',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  readonly: false,
} satisfies CookieOptions<string>
