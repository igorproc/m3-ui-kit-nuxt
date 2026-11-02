/**
 * Public prop surface for `<MDialog>` — the M3 basic dialog on the shared
 * modal layer.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mModalLayerProps } from '#kit/components/ui/overlay/props'

/**
 * ARIA role of the dialog. `alertdialog` interrupts with something that needs
 * an answer (a confirmation): its body becomes the dialog's description.
 */
export type MDialogRole = 'dialog' | 'alertdialog'

export const mDialogProps = {
  /** Headline; it names the dialog. The `title` slot takes precedence. */
  title: { type: String, default: undefined },
  role: { type: String as PropType<MDialogRole>, default: 'dialog' },
  ...mModalLayerProps,
}

export type MDialogProps = ExtractPublicPropTypes<typeof mDialogProps>
