export interface ITheme {
  key: string // Identifier (data-theme="key")
  name: string // Localized name
  color?: string // HEX seed for dynamic MD3 palette generation
  definedInScss?: boolean // Flag: theme is already described in static SCSS files
}

interface IThemeWithPreset extends ITheme {
  preset: 'tonalSpot' | 'monochrome' | 'neutral' | 'vibrant' | 'fidelity'
}

export type TTheme = ITheme | IThemeWithPreset

export type TDefinition = 'light' | 'dark' | 'system'
export type TResolvedDefinition = 'light' | 'dark'

/**
 * Palette selection persisted in the cookie.
 * - `isCustom: false` → `key` is a predefined palette key (from `themes`), resolved by build-time SCSS.
 * - `isCustom: true`  → `key` is a HEX seed, its scheme is generated and injected at runtime.
 */
export interface IPaletteCookie {
  isCustom: boolean
  key: string
}

export interface ICookie {
  theme: {
    definition?: string
    palette?: string
    contrast?: string
  }
}

export interface MaterialKitOptions {
  breakpoints?: Partial<Record<'desktop' | 'desktop-xs' | 'tablet' | 'tablet-xs' | 'mobile' | 'mobile-xs', string>>
  cookie?: Partial<ICookie>
  /** @deprecated use `defaultPalette` */
  defaultTheme?: string // Default palette key (legacy alias)
  defaultDefinition?: TDefinition // Default definition (built-in: 'dark')
  defaultPalette?: string // Default palette key
  defaultContrast?: string // Default contrast
  themes?: TTheme[] // List of available themes
  typography?: {
    fontFamily?: string // Base font family
  }
}
