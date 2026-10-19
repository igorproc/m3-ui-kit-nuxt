// Relative on purpose: this is imported by `src/module.ts` at build time, where the
// `#kit` alias does not exist yet — the module itself registers it during `setup()`.
import { DEFAULT_FONTS, DEFAULT_TYPEFACE } from '../../shared/constants/typography'
import type { IMaterialKitTypography, ITypeface } from '../../shared/types/kit'

export interface ResolvedTypography {
  typeface: Required<ITypeface>
  fonts: string[]
}

const TYPEFACE_ROLES = Object.keys(DEFAULT_TYPEFACE) as (keyof ITypeface)[]

/**
 * Fills the consumer's typography options with the kit defaults (Roboto).
 *
 * Resolved here rather than through the module `defaults`: Nuxt merges those with
 * defu, which concatenates arrays — a consumer's own `fonts` would load on top of
 * Roboto instead of replacing it.
 */
export function resolveTypography(options: IMaterialKitTypography = {}): ResolvedTypography {
  const typeface = { ...DEFAULT_TYPEFACE }

  for (const role of TYPEFACE_ROLES) {
    const stack = options.typeface?.[role]?.trim()
    if (stack) typeface[role] = stack
  }

  const fonts = options.fonts === false ? [] : options.fonts ?? DEFAULT_FONTS

  return { typeface, fonts: [...new Set(fonts)] }
}

/** The `$material-kit-typeface` map for the generated `~material-kit-config`. */
export function typefaceToScss(typeface: Required<ITypeface>): string {
  const entries = TYPEFACE_ROLES
    .map(role => `  ${role}: ${JSON.stringify(typeface[role])},`)
    .join('\n')

  return `$material-kit-typeface: (\n${entries}\n);\n`
}
