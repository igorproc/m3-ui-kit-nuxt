/**
 * Public prop surface for `<MAlert>` — a persistent inline status block.
 *
 * `MAlert` occupies normal document layout and never teleports or
 * auto-dismisses: transient toast feedback stays with `<MSnackbar>`.
 * Severity is the single source of color, icon and live-region semantics, so
 * no free-form `color` prop exists that could contradict `type`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/** Severity of the message. Drives tokens, default icon and ARIA semantics. */
export type MAlertType = 'info' | 'success' | 'warning' | 'error'

/** M3 surface taxonomy available to an inline status block. */
export type MAlertVariant = 'tonal' | 'outlined'

/**
 * Live-region behavior. `auto` derives politeness from `type`; `off` renders a
 * semantic region without announcements (e.g. alerts already in SSR HTML).
 */
export type MAlertAnnounce = 'auto' | 'polite' | 'assertive' | 'off'

export const mAlertProps = {
  /** Severity of the message. */
  type: { type: String as PropType<MAlertType>, default: 'info' },
  /** M3 surface preset. */
  variant: { type: String as PropType<MAlertVariant>, default: 'tonal' },
  /** Plain-text title; the `title` slot takes precedence. */
  title: { type: String, default: undefined },
  /** Plain-text body; the default slot takes precedence. */
  text: { type: String, default: undefined },
  /** `undefined` resolves the severity icon, `false` removes the leading icon. */
  icon: { type: [String, Boolean] as PropType<string | false>, default: undefined },
  /** Renders the dismiss control. */
  closable: { type: Boolean, default: false },
  /** Accessible name of the dismiss control. */
  closeLabel: { type: String, default: 'Close' },
  /** Live-region politeness. */
  announce: { type: String as PropType<MAlertAnnounce>, default: 'auto' },
}

export type MAlertProps = ExtractPublicPropTypes<typeof mAlertProps>

/** Payload of the `icon` slot. */
export interface MAlertIconSlot {
  type: MAlertType
  icon: string
}

/** Payload of the `actions` slot. */
export interface MAlertActionsSlot {
  type: MAlertType
  close: () => void
}

/**
 * Payload of the whole-control `close` slot.
 *
 * `props.class` hands the alert-owned geometry and severity state layers to a
 * replacement control, so a custom close keeps the same hit target and tokens.
 */
export interface MAlertCloseSlot {
  close: () => void
  props: {
    type: 'button'
    class: string
    ariaLabel: string
    disabled: false
    onClick: () => void
  }
}
