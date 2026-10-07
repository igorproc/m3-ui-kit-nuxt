/**
 * Props for `<MSplitButton>` — composes the shared color/variant/state props
 * with the split-button's own `items` list.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeStateProps, makeVariantProps } from '#kit/shared/utils/props'
import type { MIconName } from '#kit/components/ui/icon/props'

export interface UiSplitMenuItem {
  label: string
  icon?: MIconName
  value?: string | number
  action?: () => void
}

export const mSplitButtonProps = {
  ...makeColorProps(),
  ...makeVariantProps(),
  ...makeStateProps(),
  /** Secondary actions shown in the attached menu. */
  items: { type: Array as PropType<UiSplitMenuItem[]>, default: () => [] },
  /**
   * Accessible name of the icon-only half that opens the menu. No default: the
   * kit does not invent copy in a language it cannot know, and warns in dev
   * when it is missing.
   */
  dropdownAriaLabel: { type: String, default: undefined },
}

export type MSplitButtonProps = ExtractPublicPropTypes<typeof mSplitButtonProps>
