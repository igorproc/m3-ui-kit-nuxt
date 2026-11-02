/**
 * Public prop surface for `<MSwitch>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * Only `disabled` comes from the shared state contract: a switch commits
 * instantly, so it has no `loading`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'
import { mChoiceFieldProps } from '#kit/utils/choice/props'
import type { MChoiceSupportSlots } from '#kit/utils/choice/props'

const { disabled } = makeStateProps()

/** Glyphs in the thumb: none, only while on, or in both values. */
export type MSwitchIcons = 'none' | 'selected' | 'both'

export const mSwitchProps = {
  disabled,
  ...mChoiceFieldProps,
  /** Glyphs in the thumb (check / close); the `#icon` slot draws its own. */
  icons: { type: String as PropType<MSwitchIcons>, default: 'none' },
  /** Text beside the track; the default slot replaces it. */
  label: { type: String, default: undefined },
}

export type MSwitchProps = ExtractPublicPropTypes<typeof mSwitchProps>

export interface MSwitchSlots extends MChoiceSupportSlots {
  /** The label beside the track; replaces `label`. */
  default?: () => unknown
  /** The glyph in the thumb, when `icons` shows one. */
  icon?: (scope: { checked: boolean }) => unknown
}
