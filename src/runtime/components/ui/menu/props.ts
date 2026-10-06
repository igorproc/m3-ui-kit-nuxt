/**
 * Public prop surface for `<MMenu>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { UiMenuOrigin } from './types'

export const mMenuProps = {
  closeOnBackdrop: { type: Boolean, default: true },
  absolute: { type: Boolean, default: false },
  origin: { type: String as PropType<UiMenuOrigin>, default: 'top left' },
  matchWidth: { type: Boolean, default: false },
  /** Lock page scroll while the menu is open. */
  lockScroll: { type: Boolean, default: true },
  /**
   * Element the surface is positioned against. Defaults to the menu's parent
   * element, which is right whenever the parent *is* the trigger.
   *
   * A composite field is the case where it is not: its box also holds the
   * label and the support line, so anchoring to it drops the menu below the
   * helper text with a gap the size of that line. Such a consumer passes the
   * drawn container instead.
   */
  anchor: { type: Object as PropType<HTMLElement | null>, default: null },
}

export type MMenuProps = ExtractPublicPropTypes<typeof mMenuProps>
