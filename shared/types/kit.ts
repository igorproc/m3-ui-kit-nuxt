export interface ITheme {
  key: string // Identifier (data-theme="key")
  name: string // Localized name
  color?: string // HEX seed for dynamic MD3 palette generation
  definedInScss?: boolean // Flag: theme is already described in static SCSS files
}

export interface ICookie {
  theme: {
    definition: string
    pallete: string
    contrast: string
  }
}

export interface MaterialKitOptions {
  breakpoints?: Partial<Record<'desktop' | 'desktop-xs' | 'tablet' | 'tablet-xs' | 'mobile' | 'mobile-xs', string>>
  cookie: ICookie
  defaultTheme?: string // Default theme key
  themes?: ITheme[] // List of available themes
  typography?: {
    fontFamily?: string // Base font family
  }
}
