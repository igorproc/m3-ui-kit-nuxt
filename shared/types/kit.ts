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
  defaultTheme?: string // Default theme key
  themes?: TTheme[] // List of available themes
  typography?: {
    fontFamily?: string // Base font family
  }
}
