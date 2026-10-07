/**
 * Props for `<MSplitButton>` — the shared colour and state props, the family's
 * `density`, and the name of the trailing button. What the trailing button
 * does is the consumer's: it emits `trailing`, and with a `#menu` slot it
 * opens that menu.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeStateProps } from '#kit/shared/utils/props'
import type { MVariant } from '#kit/shared/types/props'
import type { MButtonDensity } from '../props'

/** M3 split buttons come in every button variant but `text`. */
export type MSplitButtonVariant = Extract<MVariant, 'filled' | 'tonal' | 'elevated' | 'outlined'>

export const mSplitButtonProps = {
  ...makeColorProps(),
  variant: { type: String as PropType<MSplitButtonVariant>, default: 'filled' },
  /** Height, padding and icon step of both buttons. */
  density: { type: String as PropType<MButtonDensity>, default: 'default' },
  ...makeStateProps(),
  /**
   * Accessible name of the icon-only trailing button. No default: the kit does
   * not invent copy in a language it cannot know, and warns in dev when it is
   * missing.
   */
  trailingAriaLabel: { type: String, default: undefined },
  /** @deprecated Use `trailingAriaLabel`. Still honoured for one release. */
  dropdownAriaLabel: { type: String, default: undefined },
}

export type MSplitButtonProps = ExtractPublicPropTypes<typeof mSplitButtonProps>
