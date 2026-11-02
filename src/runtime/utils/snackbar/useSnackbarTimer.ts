/**
 * @module utils/snackbar/useSnackbarTimer
 *
 * @remarks
 * The life of an open snackbar. It runs while the snackbar is open and pauses
 * while the pointer is over it or focus is inside it — someone reaching for
 * the action must not see it vanish (WCAG 2.2.1). An `indefinite` snackbar
 * has no timer at all.
 */
import { computed, watch } from 'vue'
import type { Ref } from 'vue'
import { useTimer } from '#kit/composables/useTimer'
import { SNACKBAR_DURATIONS } from '#kit/components/ui/snackbar/props'
import type { MSnackbarDuration } from '#kit/components/ui/snackbar/props'

export interface UseSnackbarTimerOptions {
  open: Ref<boolean>
  duration: () => MSnackbarDuration | undefined
  hasAction: () => boolean
  onTimeout: () => void
}

export interface UseSnackbarTimerReturn {
  /** Milliseconds the snackbar lives, `null` when it waits to be closed. */
  lifetime: Readonly<Ref<number | null>>
  hold: () => void
  release: () => void
}

export function useSnackbarTimer(options: UseSnackbarTimerOptions): UseSnackbarTimerReturn {
  const lifetime = computed<number | null>(() => {
    const duration = options.duration() ?? (options.hasAction() ? 'long' : 'short')
    if (duration === 'indefinite') return null
    return typeof duration === 'number' ? duration : SNACKBAR_DURATIONS[duration]
  })

  const timer = useTimer(options.onTimeout, { duration: () => lifetime.value ?? 0 })

  // Hover and focus may overlap; the timer runs again only when both let go.
  let holds = 0

  watch(options.open, (open) => {
    holds = 0
    if (open && lifetime.value !== null) timer.start()
    else timer.stop()
  }, { immediate: true })

  function hold() {
    if (holds++ === 0) timer.pause()
  }

  function release() {
    if (holds === 0) return
    if (--holds === 0) timer.resume()
  }

  return { lifetime, hold, release }
}
