import type { ExtractPublicPropTypes, PropType } from 'vue'
import { propsFactory } from '#kit/shared/utils/props/propsFactory'

export type MLazyMode = 'eager' | 'on-idle' | 'on-view' | 'on-interaction'
export type MLazyInteraction = 'pointerenter' | 'pointerdown' | 'click' | 'focus'
export type MLazyStatus = 'idle' | 'pending' | 'active' | 'error'
export type MLazyActivationReason = 'eager' | 'idle' | 'view' | 'interaction' | 'manual'

export interface MLazyActivation {
  reason: MLazyActivationReason
  event?: Event
}

export interface MLazySlotState {
  status: MLazyStatus
  isActive: boolean
  activation: MLazyActivation | null
  activate: () => void
  retry: () => void
}

export interface MLazySlots {
  default?: (state: MLazySlotState) => unknown
  placeholder?: (state: MLazySlotState) => unknown
  fallback?: (state: MLazySlotState) => unknown
  error?: (state: MLazySlotState & { error: unknown }) => unknown
}

export interface MLazyEmits {
  (event: 'activate', activation: MLazyActivation): void
  (event: 'visible' | 'pending' | 'resolve'): void
  (event: 'error', error: unknown): void
}

export const makeMLazyProps = propsFactory({
  /** When the content is activated: at once, when the browser is idle, near the viewport, or on interaction. */
  mode: { type: String as PropType<MLazyMode>, default: 'on-view' },
  /** Keep the content once activated; `false` releases it again when it leaves the viewport in `on-view` mode. */
  once: { type: Boolean, default: true },
  /** Longest wait for an idle moment in `on-idle` mode, ms. */
  timeout: { type: Number, default: 2000 },
  /** Margin around the viewport that already counts as visible in `on-view` mode. */
  rootMargin: { type: String, default: '200px 0px' },
  /** Visible share of the boundary that activates it in `on-view` mode. */
  threshold: { type: [Number, Array] as PropType<number | number[]>, default: 0 },
  /** Events that activate the content in `on-interaction` mode; Enter and Space on the boundary always do. */
  interactions: {
    type: Array as PropType<MLazyInteraction[]>,
    default: () => ['pointerenter', 'focus', 'click'],
  },
  /** Width reserved before and during activation; a number is in rem. */
  minWidth: { type: [String, Number] as PropType<string | number>, default: undefined },
  /** Height reserved before and during activation; a number is in rem. */
  minHeight: { type: [String, Number] as PropType<string | number>, default: undefined },
  /** Fade the content, the fallback and the error in when they appear after activation. */
  transition: { type: Boolean, default: true },
  /** Render the content at once, whatever the mode. */
  disabled: { type: Boolean, default: false },
  /** Wait before the #fallback slot replaces the placeholder while the content loads, ms. */
  fallbackDelay: { type: Number, default: 200 },
  /** Message announced when the content fails and there is no #error slot. */
  errorText: { type: String, default: undefined },
  /** Name of the retry button shown when the content fails and there is no #error slot. */
  retryLabel: { type: String, default: undefined },
})

export const mLazyProps = makeMLazyProps()

export type MLazyProps = ExtractPublicPropTypes<typeof mLazyProps>
