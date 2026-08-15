import type { PropType } from 'vue'
import type { InferResolvedType, InferType, MVariant } from '~~/shared/types/props'

export type MAlertType = 'info' | 'success' | 'warning' | 'error'
export type MAlertVariant = Extract<MVariant, 'tonal' | 'outlined'>
export type MAlertAnnounce = 'auto' | 'polite' | 'assertive' | 'off'

export const mAlertProps = {
  /** Severity that selects the visual scheme and automatic announcement level. */
  type: { type: String as PropType<MAlertType>, default: 'info' },
  /** Surface treatment of the alert container. */
  variant: { type: String as PropType<MAlertVariant>, default: 'tonal' },
  /** Plain-text heading; the title slot takes precedence. */
  title: { type: String, default: '' },
  /** Plain-text message; the default slot takes precedence. */
  text: { type: String, default: '' },
  /** Explicit leading icon name; false leaves the icon area empty. */
  icon: { type: [String, Boolean] as PropType<string | false>, default: false },
  /** Renders the dismiss control. */
  closable: { type: Boolean, default: false },
  /** Accessible name of the dismiss control. */
  closeLabel: { type: String, default: 'Close' },
  /** Live-region behavior; auto is assertive only for errors. */
  announce: { type: String as PropType<MAlertAnnounce>, default: 'auto' },
}

export interface MAlertProps extends InferType<typeof mAlertProps> {}
export interface MAlertResolvedProps extends InferResolvedType<typeof mAlertProps> {}

export interface MAlertIconSlot {
  type: MAlertType
  icon: string | false
}

export interface MAlertActionsSlot {
  type: MAlertType
  close: () => void
}

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

export interface MAlertSlots {
  default?: () => unknown
  title?: () => unknown
  icon?: (slot: MAlertIconSlot) => unknown
  actions?: (slot: MAlertActionsSlot) => unknown
  close?: (slot: MAlertCloseSlot) => unknown
}
