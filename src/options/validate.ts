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
