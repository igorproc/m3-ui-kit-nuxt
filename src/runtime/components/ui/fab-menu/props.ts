/**
 * Public prop surface for `<MFabMenu>`.
 *
 * The FAB and its actions share one MD3 colour role: the closed FAB and the
 * actions wear `<role>-container`, the open FAB the role itself. The FAB takes
 * the button family's `density`; `align` is logical, so the menu follows the
 * writing direction.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps } from '#kit/shared/utils/props'
import { ICONS } from '#kit/shared/constants/icons'
import type { MSize } from '#kit/shared/types/props'
import type { MButtonDensity } from '#kit/components/ui/button/props'

export interface MFabMenuItem {
  /** Visible label, also the action's accessible name. */
  label: string
  icon?: string
  value?: string | number
  action?: () => void
  disabled?: boolean
}

/** Edge the FAB and its actions line up on, in the writing direction. */
export type MFabMenuAlign = 'start' | 'end'

export const mFabMenuProps = {
  ...makeColorProps(),
  /** FAB step: 40 / 56 / 96. */
  density: { type: String as PropType<MButtonDensity>, default: 'default' },
  /**
   * @deprecated Use `density`: `sm` → `compact`, `md` → `default`,
   * `lg` → `comfortable`. Still honoured for one release.
   */
  size: { type: String as PropType<MSize>, default: undefined },
  disabled: { type: Boolean, default: false },
  items: { type: Array as PropType<MFabMenuItem[]>, default: () => [] },
  /**
   * Edge the FAB and its actions align to. `left` / `right` are retired
   * (`start` / `end`) and still honoured for one release.
   */
  align: { type: String as PropType<MFabMenuAlign | 'left' | 'right'>, default: 'end' },
  /** Accessible name of the default FAB; no default copy is shipped. */
  ariaLabel: { type: String, default: undefined },
  openIcon: { type: String, default: ICONS.add },
  closeIcon: { type: String, default: ICONS.close },
}

export type MFabMenuProps = ExtractPublicPropTypes<typeof mFabMenuProps>
