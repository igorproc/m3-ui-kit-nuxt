import type { PropType } from 'vue'
import type { InferResolvedType, InferType, MColor, MVariant } from '#kit/shared/types/props'
import type { MIconName } from '#kit/components/ui/icon/props'

/** Severity: the theme role the alert is drawn in and the icon it shows. */
export type MAlertColor = Extract<MColor, 'info' | 'success' | 'warning' | 'error'>
export type MAlertVariant = Extract<MVariant, 'tonal' | 'outlined'>
export type MAlertAnnounce = 'auto' | 'polite' | 'assertive' | 'off'

export const mAlertProps = {
  /** Severity that selects the visual scheme, the default icon and the automatic announcement level. */
  color: { type: String as PropType<MAlertColor>, default: 'info' },
  /** Surface treatment of the alert container. */
  variant: { type: String as PropType<MAlertVariant>, default: 'tonal' },
  /** Plain-text heading; the title slot takes precedence. */
  title: { type: String, default: '' },
  /** Plain-text message; the default slot takes precedence. */
  text: { type: String, default: '' },
  /** Leading icon. By default the severity's own; `false` shows none. */
  icon: { type: [String, Boolean] as PropType<MIconName | false>, default: undefined },
  /** Renders the dismiss control. */
  closable: { type: Boolean, default: false },
  /**
   * Accessible name of the dismiss control. No default: copy the kit would
   * invent cannot be in the app's language.
   */
  closeLabel: { type: String, default: undefined },
  /**
   * Announcement when the alert appears; `auto` is assertive only for errors.
   * `off` suits permanent content already in the server HTML.
   */
  announce: { type: String as PropType<MAlertAnnounce>, default: 'auto' },
  /** Closing from inside moves focus to what follows the alert; `false` leaves it to the caller. */
  returnFocus: { type: Boolean, default: true },
}

export interface MAlertProps extends InferType<typeof mAlertProps> {}
export interface MAlertResolvedProps extends InferResolvedType<typeof mAlertProps> {}

export interface MAlertIconSlot {
  color: MAlertColor
  icon: MIconName | false
}

export interface MAlertActionsSlot {
  color: MAlertColor
  close: () => void
}

export interface MAlertCloseSlot {
  close: () => void
  /** Kebab-case keys: the SSR renderer lowercases a camelCase attribute. */
  props: {
    'type': 'button'
    'class': string
    'aria-label': string | undefined
    'disabled': false
    'onClick': () => void
  }
}

export interface MAlertSlots {
  default?: () => unknown
  title?: () => unknown
  icon?: (slot: MAlertIconSlot) => unknown
  actions?: (slot: MAlertActionsSlot) => unknown
  close?: (slot: MAlertCloseSlot) => unknown
}
