import { reactive } from 'vue'
import { usePreferredColorScheme } from '@vueuse/core'
import { useCookie, useRuntimeConfig, useState } from '#app'

import { THEME_COOKIE_OPTIONS, THEME_DEFINITIONS, THEME_CONTRASTS, FALLBACK_PALETTE_KEY } from '#kit/shared/constants/theme'
import { createThemeController } from '#kit/utils/theme/createThemeController'
import type { TDefinition, IPaletteCookie } from '#kit/shared/types/kit'

/**
 * Wires the pure {@link createThemeController} to Nuxt: cookies for persisted state,
 * `prefers-color-scheme` for `definition: 'system'`, module options for the defaults.
 *
 * Called exactly once, by the kit's `material` plugin — the plugin body runs inside
 * `nuxtApp._scope`, so the cookie watchers and the `matchMedia` subscription are torn
 * down with the app instead of with whichever component happened to ask first.
 *
 * Exposed as a `reactive` object so property access is drop-in: `theme.palette` reads,
 * `theme.definition = 'light'` writes.
 */
export function createMaterialTheme() {
  const config = useRuntimeConfig().public.materialKit
  const cookieKeys = config.cookie.theme

  const defaults = config.theme?.default ?? {}
  const defaultDefinition = (defaults.definition ?? THEME_DEFINITIONS.DARK) as TDefinition
  const defaultPalette = defaults.palette ?? FALLBACK_PALETTE_KEY
  const defaultContrast = (defaults.contrast ?? THEME_CONTRASTS.MEDIUM) as string

  // Cookies — trusted as-is, no dictionary validation.
  const definitionCookie = useCookie<TDefinition>(cookieKeys.definition, { default: () => defaultDefinition, ...THEME_COOKIE_OPTIONS })
  const contrastCookie = useCookie<string>(cookieKeys.contrast, { default: () => defaultContrast, ...THEME_COOKIE_OPTIONS })
  const paletteCookie = useCookie<IPaletteCookie>(cookieKeys.palette, { default: () => ({ isCustom: false, key: defaultPalette }), ...THEME_COOKIE_OPTIONS })

  const preferredColorScheme = usePreferredColorScheme()

  // Palette the rendered CSS belongs to — see `ThemeControllerDeps.committedPalette`.
  const committedPalette = useState<string>('md:theme-palette', () => '')

  const controller = createThemeController({
    config,
    definitionCookie,
    contrastCookie,
    paletteCookie,
    preferredColorScheme,
    committedPalette,
  })

  // Rendered CSS for the active palette. Filled during SSR by `theme-css.server`
  // and carried to the client in the payload, so the browser never runs the color
  // utilities just to reproduce markup it already received; `theme-css.client`
  // reloads the generator on demand when the theme actually changes.
  const themeCss = useState<string>('md:theme-css', () => '')

  // Which scheme the cached CSS was rendered for. Lets the client tell "already
  // correct" from "server and client disagree" without re-running the generator.
  const themeCssKey = useState<string>('md:theme-css-key', () => '')

  return reactive({ ...controller, themeCss, themeCssKey, committedPalette })
}

export type MaterialThemeController = ReturnType<typeof createMaterialTheme>
