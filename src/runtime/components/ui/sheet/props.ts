/**
 * Public prop surface for `<MSheet>` (bottom sheet / swipe-to-dismiss modal).
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mModalLayerProps } from '#kit/components/ui/overlay/props'
import type { MOverlaySwipeDirection } from '#kit/components/ui/overlay/props'

/** `<MSheet>` props — the shared modal layer, swiping down to close by default. */
export const mSheetProps = {
  ...mModalLayerProps,
  /** Swipe that closes the sheet; it starts on the drag handle only, so the body scrolls. */
  closeOnSwipe: { type: String as PropType<MOverlaySwipeDirection>, default: 'down' },
  /**
   * Accessible name of the sheet. No default: copy the kit would invent
   * cannot be in the app's language. `aria-labelledby` works as well.
   */
  ariaLabel: { type: String, default: undefined },
}

export type MSheetProps = ExtractPublicPropTypes<typeof mSheetProps>
