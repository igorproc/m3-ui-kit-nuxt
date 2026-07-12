/**
 * Public prop surface for `<MHotkey>` — the M3 visual shortcut hint.
 *
 * Pass a `hotkey` presentation (from `useHotkey`) for behavior-linked hints, or
 * a static `keys` array for a standalone badge (also covering the single-key
 * `VKbd` role). Exactly one source must be supplied.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { HotkeyKey, HotkeyPlatform, HotkeyPresentation } from '~~/shared/types/hotkey'

export const mHotkeyProps = {
  /** Presentation model returned by `useHotkey` (recommended, behavior-linked). */
  hotkey: { type: Object as PropType<HotkeyPresentation>, default: undefined },
  /** Static key list for a standalone hint (mutually exclusive with `hotkey`). */
  keys: { type: Array as PropType<HotkeyKey[]>, default: undefined },
  /** Platform for static `keys` mode. */
  platform: { type: String as PropType<HotkeyPlatform>, default: 'auto' },
  /** Explicitly disable a static `keys` hint (behavioral mode uses `hotkey.isActive`). */
  disabled: { type: Boolean, default: false },
  /** Override the platform-aware separator glyph. */
  separator: { type: String as PropType<string>, default: undefined },
  /** Override the generated accessible label. */
  ariaLabel: { type: String as PropType<string>, default: undefined },
}

export type MHotkeyProps = ExtractPublicPropTypes<typeof mHotkeyProps>
