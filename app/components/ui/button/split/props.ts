/**
 * Props for `<MSplitButton>` — composes the shared color/variant/state props
 * with the split-button's own `items` list.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeStateProps, makeVariantProps } from '~~/shared/utils/props'

export interface UiSplitMenuItem {
  label: string
  icon?: string
  value?: string | number
  action?: () => void
}

export const mSplitButtonProps = {
  ...makeColorProps(),
  ...makeVariantProps(),
  ...makeStateProps(),
  /** Secondary actions shown in the attached menu. */
  items: { type: Array as PropType<UiSplitMenuItem[]>, default: () => [] },
}

export type MSplitButtonProps = ExtractPublicPropTypes<typeof mSplitButtonProps>
