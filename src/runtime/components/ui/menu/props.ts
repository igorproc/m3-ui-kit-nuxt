/**
 * Public prop surface for `<MMenu>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MMenuPlacement, MMenuVariant } from './types'

export const mMenuProps = {
  /** Colour of the menu: `elevated` is the standard `surface-container-low`, `tonal` the vibrant `tertiary-container`. */
  variant: { type: String as PropType<MMenuVariant>, default: 'elevated' },
  /** Close on a press outside the menu and its trigger. `click-outside` is emitted either way. */
  closeOnBackdrop: { type: Boolean, default: true },
  /**
   * Side of the anchor the menu opens on, and the edge it aligns to. `start`
   * and `end` follow the writing direction; the menu flips when it does not fit.
   */
  placement: { type: String as PropType<MMenuPlacement>, default: 'bottom-start' },
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
