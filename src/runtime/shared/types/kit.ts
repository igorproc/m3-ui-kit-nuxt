export type TThemeVariant
  = 'tonalSpot' | 'neutral' | 'vibrant' | 'expressive'
    | 'monochrome' | 'fidelity' | 'content' | 'rainbow' | 'fruitSalad'

/** `'standard' | 'medium' | 'high'` → `0 | 0.5 | 1`; a raw number is passed through (clamped -1..1). */
export type TThemeContrast = 'standard' | 'medium' | 'high' | number

/** Semantic seed map: `name → HEX`, or `{ color, blend }` to override blend per color. */
export type TSemanticColors = Record<string, string | { color: string, blend?: boolean }>

export interface ITheme {
  key: string // Identifier (data-palette="key")
  name: string // Localized name
  color?: string // HEX seed for dynamic MD3 palette generation
  definedInScss?: boolean // Flag: theme is already described in static SCSS files
}

export interface IDynamicThemeOptions {
  /** Named MCU variant (sugar over DynamicScheme). Default `tonalSpot`. */
  variant?: TThemeVariant
  /** @deprecated alias of `variant`. */
  preset?: 'tonalSpot' | 'monochrome' | 'neutral' | 'vibrant' | 'fidelity'
  /** Build-time default contrast for this theme. Runtime may override. */
  contrast?: TThemeContrast
  /** Chroma of the neutral + neutralVariant palettes. Overrides the variant's neutrals. */
  neutralChroma?: number
  /** Optional overall chroma (primary/secondary/tertiary). */
  chroma?: number
  /** Per-theme semantic overrides (merged over the global `semanticColors`). */
  semanticColors?: TSemanticColors
  /** MCU design-spec version. Default `'2025'` (needed for `*-dim` roles). */
  specVersion?: '2021' | '2025'
}

export type TTheme = ITheme & IDynamicThemeOptions

export type TDefinition = 'light' | 'dark' | 'system'
export type TResolvedDefinition = 'light' | 'dark'

/**
 * Palette selection persisted in the cookie.
 * - `isCustom: false` → `key` is a predefined palette key (from `themes`).
 * - `isCustom: true`  → `key` is a HEX seed, its scheme is generated at runtime.
 */
export interface IPaletteCookie {
  isCustom: boolean
  key: string
  /** Runtime override of the active theme's neutral chroma (null = use config). */
  neutralChroma?: number | null
  /** Runtime override of the active theme's variant (null = use config). */
  variant?: TThemeVariant | null
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
  defaultContrast?: TThemeContrast // Default contrast
  defaultVariant?: TThemeVariant // Default variant for themes without one
  defaultNeutralChroma?: number // Default neutral chroma for themes without one
  /** Global semantic seeds (harmonized to each palette). Defaults to success/warning/info. */
  semanticColors?: TSemanticColors
  /** Global default for semantic `blend`. Default `true`. */
  semanticBlend?: boolean
  themes?: TTheme[] // List of available themes
  typography?: {
    fontFamily?: string // Base font family
  }
}
