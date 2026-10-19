import type { ITypeface } from '../types/kit'

/** MD3 baseline: Roboto for both brand and plain; mono is never loaded, the system one is enough. */
export const DEFAULT_TYPEFACE: Required<ITypeface> = {
  brand: 'Roboto, sans-serif',
  plain: 'Roboto, sans-serif',
  mono: 'ui-monospace, monospace',
}

export const DEFAULT_FONTS: readonly string[] = [
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400..700;1,400..700&display=swap',
]
