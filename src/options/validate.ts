import { HEX_SEED_PATTERN } from '../runtime/shared/constants/theme'
import type { MaterialKitOptions } from '../runtime/shared/types/kit'

export interface UndeclaredDefaultPalette {
  palette: string
  declared: string[]
}

/**
 * Checks that `theme.default.palette` names a palette that actually exists.
 *
 * A default pointing at a missing key does not fail anywhere: the controller finds no
 * matching theme, the generator receives an empty seed and returns `null`, and the app
 * renders without a single color token — no error, no warning. A typo in the key is
 * the usual way to get there, which is why the module refuses to build instead.
 *
 * Returns `null` when the configuration is fine.
 */
export function findUndeclaredDefaultPalette(options: MaterialKitOptions): UndeclaredDefaultPalette | null {
  const palette = options.theme?.default?.palette
  if (!palette) return null

  const declared = (options.theme?.themes ?? [])
    .map(theme => theme?.key)
    .filter((key): key is string => Boolean(key))

  return declared.includes(palette) ? null : { palette, declared }
}

export interface InvalidSeed {
  key: string
  color: string
}

/**
 * Lists the themes whose `color` the palette generator cannot parse (it takes a HEX
 * seed of 3, 6 or 8 digits). At runtime such a seed throws inside the theme plugin,
 * which degrades to "no palette", so the module refuses to build instead.
 */
export function findInvalidSeeds(options: MaterialKitOptions): InvalidSeed[] {
  return (options.theme?.themes ?? [])
    .filter(theme => theme?.color !== undefined && !HEX_SEED_PATTERN.test(theme.color))
    .map(theme => ({ key: theme.key, color: theme.color! }))
}
