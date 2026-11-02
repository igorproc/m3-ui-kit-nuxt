/**
 * Public prop surface for `<MMenuItem>` — one action in an `<MMenu>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MIconName } from '#kit/components/ui/icon/props'

/**
 * `menuitem` runs an action; `menuitemcheckbox` toggles a setting and keeps
 * the menu open; `menuitemradio` picks one of a `<MMenuGroup>`.
 */
export type MMenuItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'

export const mMenuItemProps = {
  /** Visible label; the default slot takes precedence. */
  label: { type: String, default: '' },
  /** A second, quieter line under the label. */
  supportingText: { type: String, default: '' },
  leadingIcon: { type: String as PropType<MIconName>, default: undefined },
  trailingIcon: { type: String as PropType<MIconName>, default: undefined },
  /** Text at the end of the row: a keyboard shortcut, a count. */
  trailingText: { type: String, default: '' },
  role: { type: String as PropType<MMenuItemRole>, default: 'menuitem' },
  /** Checked state of a `menuitemcheckbox` / `menuitemradio`; shown with a check, not by colour alone. */
  selected: { type: Boolean, default: false },
  /** Stays in the arrow order but does nothing (`aria-disabled`). */
  disabled: { type: Boolean, default: false },
  /** Renders a link: the item navigates instead of running an action. */
  href: { type: String, default: undefined },
}

export type MMenuItemProps = ExtractPublicPropTypes<typeof mMenuItemProps>

export interface MMenuItemEmits {
  (event: 'select', value: MouseEvent): void
}
