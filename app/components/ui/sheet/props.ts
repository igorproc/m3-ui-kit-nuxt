/**
 * Public prop surface for `<MSheet>` (bottom sheet / drag-to-dismiss modal).
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { M3ModalContext } from '~/composables/modal/useModal'

/** `<MSheet>` props. */
export const mSheetProps = {
  clickToClose: { type: Boolean, default: true },
  escToClose: { type: Boolean, default: true },
  parent: { type: Object as PropType<M3ModalContext | null>, default: undefined },
}

export type MSheetProps = ExtractPublicPropTypes<typeof mSheetProps>
