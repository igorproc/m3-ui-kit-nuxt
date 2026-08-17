/**
 * Public prop surface for `<MSnackbar>`.
 */
import type { ExtractPublicPropTypes } from 'vue'

/** `<MSnackbar>` props. */
export const mSnackbarProps = {
  label: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
}

export type MSnackbarProps = ExtractPublicPropTypes<typeof mSnackbarProps>
