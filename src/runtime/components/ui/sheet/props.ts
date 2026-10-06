/**
 * Public prop surface for `<MSheet>` (bottom sheet / swipe-to-dismiss modal).
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mModalLayerProps } from '#kit/components/ui/overlay/props'
import type { MOverlaySwipeDirection } from '#kit/components/ui/overlay/props'

/** `<MSheet>` props — the shared modal layer, swiping down to close by default. */
export const mSheetProps = {
  ...mModalLayerProps,
  closeOnSwipe: { type: String as PropType<MOverlaySwipeDirection>, default: 'down' },
}

export type MSheetProps = ExtractPublicPropTypes<typeof mSheetProps>
