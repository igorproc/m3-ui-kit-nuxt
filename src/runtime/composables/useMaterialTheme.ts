import { useNuxtApp } from '#app'
import type { MaterialThemeController } from '#kit/utils/theme/createMaterialTheme'

/**
 * The application's theme controller (replaces the former Pinia `themeStore`).
 *
 * Cookie-backed state plus computed derivations, exposed as a `reactive` object so
 * property access is drop-in: `theme.palette` reads the value,
 * `theme.definition = 'light'` writes it.
 *
 * One instance per Nuxt app — created by the `material` plugin, not here — so every
 * caller shares the same refs and a write in one component is visible synchronously
 * in every other.
 *
 * Note that destructuring loses reactivity, as with any `reactive` object: keep the
 * object (`theme.palette`) or wrap it in `toRefs()`.
 */
export function useMaterialTheme(): MaterialThemeController {
  const { $material } = useNuxtApp()

  return $material.theme
}

/** @deprecated Renamed to `useMaterialTheme`. Kept for one minor for compatibility. */
export const useThemeStore = useMaterialTheme
