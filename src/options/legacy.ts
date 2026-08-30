/**
 * Top-level `materialKit` options that moved under `theme` in 0.4.
 *
 * Nuxt deep-merges module defaults with the consumer's config, so a stale flat
 * key is not an error — it simply sits there unread while `theme.themes` keeps
 * only the built-in `_m3-fallback`. The app then renders grey with no warning,
 * which is the worst possible failure mode. The module refuses to build instead.
 */
export const LEGACY_THEME_OPTIONS: Record<string, string> = {
  themes: 'theme.themes',
  defaultTheme: 'theme.default.palette',
  defaultPalette: 'theme.default.palette',
  defaultDefinition: 'theme.default.definition',
  defaultContrast: 'theme.default.contrast',
  defaultVariant: 'theme.default.variant',
  defaultNeutralChroma: 'theme.default.neutralChroma',
  semanticColors: 'theme.semanticColors',
  semanticBlend: 'theme.semanticBlend',
}

/** Returns the legacy keys present in the given options, in declaration order. */
export function findLegacyThemeOptions(options: Record<string, unknown>): string[] {
  return Object.keys(LEGACY_THEME_OPTIONS).filter(key => options[key] !== undefined)
}

/** Human-readable migration map for the given legacy keys. */
export function formatLegacyThemeOptions(keys: string[]): string {
  return keys.map(key => `  materialKit.${key} → materialKit.${LEGACY_THEME_OPTIONS[key]}`).join('\n')
}
