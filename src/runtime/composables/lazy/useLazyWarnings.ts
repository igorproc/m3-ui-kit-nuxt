import { onMounted, watchEffect } from 'vue'
import type { MLazyMode, MLazySlots } from '#kit/components/ui/lazy/props'

export interface LazyWarningProps {
  mode: MLazyMode
  disabled: boolean
  minHeight?: string | number
  errorText?: string
  retryLabel?: string
}

export function useLazyWarnings(
  props: LazyWarningProps,
  slots: MLazySlots,
  root: () => HTMLElement | null,
  isActivator: () => boolean,
) {
  if (!import.meta.dev) return

  watchEffect(() => {
    if (slots.error || (props.errorText && props.retryLabel)) return

    console.warn('[m-lazy] has no error copy: pass `errorText` and `retryLabel`, or fill the #error slot.')
  })

  watchEffect(() => {
    if (props.disabled || props.mode === 'eager' || props.minHeight !== undefined || slots.placeholder) return

    console.warn('[m-lazy] reserves no space before activation: pass `minHeight` or fill the #placeholder slot.')
  })

  onMounted(() => {
    const element = root()
    if (!element || !isActivator()) return
    if (element.textContent?.trim() || element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) return

    console.warn('[m-lazy] activates on interaction but its boundary has no name: put text or a focusable control in the #placeholder slot.')
  })
}
