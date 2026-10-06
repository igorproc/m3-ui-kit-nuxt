/**
 * Public prop surface for `<MSnackbar>`.
 */
import type { ExtractPublicPropTypes } from 'vue'

/** `<MSnackbar>` props. */
export const mSnackbarProps = {
  label: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  /**
   * Rich snackbar: on open focus moves onto the snackbar and Tab cycles inside
   * it until it closes, then focus returns to where it was.
   */
  trapFocus: { type: Boolean, default: false },
}

export type MSnackbarProps = ExtractPublicPropTypes<typeof mSnackbarProps>
