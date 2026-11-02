/**
 * Public prop surface for `<MSnackbar>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/** `short` 4 s, `long` 10 s, `indefinite` until closed, or milliseconds. */
export type MSnackbarDuration = 'short' | 'long' | 'indefinite' | number

/** `below` puts a long action on its own line under the message. */
export type MSnackbarActionPlacement = 'inline' | 'below'

/** Why a snackbar went away by itself or by its own controls. */
export type MSnackbarDismissReason = 'timeout' | 'action' | 'close'

/** M3 (`SnackbarHost.kt`): a message lives 4 s, 10 s when it offers an action. */
export const SNACKBAR_DURATIONS = { short: 4000, long: 10000 } as const

/** `<MSnackbar>` props. */
export const mSnackbarProps = {
  label: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  /**
   * How long the snackbar stays. By default `short`, or `long` when it offers
   * an action. The timer pauses while the pointer is over it or focus is in it.
   * `indefinite` needs an action or a close control: a message nobody can
   * dismiss never goes away.
   */
  duration: { type: [String, Number] as PropType<MSnackbarDuration>, default: undefined },
  actionPlacement: { type: String as PropType<MSnackbarActionPlacement>, default: 'inline' },
  /** Renders the close control. */
  closable: { type: Boolean, default: false },
  /**
   * Accessible name of the close control. No default: copy the kit would
   * invent cannot be in the app's language.
   */
  closeLabel: { type: String, default: undefined },
}

export type MSnackbarProps = ExtractPublicPropTypes<typeof mSnackbarProps>
