import { describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import { useSnackbarTimer } from './useSnackbarTimer'
import type { MSnackbarDuration } from '#kit/components/ui/snackbar/props'

function lifetimeOf(duration: MSnackbarDuration | undefined, hasAction = false) {
  const scope = effectScope()
  const timer = scope.run(() => useSnackbarTimer({ open: ref(false), duration: () => duration, hasAction: () => hasAction, onTimeout: () => {} }))!
  const value = timer.lifetime.value
  scope.stop()
  return value
}

describe('useSnackbarTimer', () => {
  // M3: a message lives 4 s, 10 s when it offers an action (W44-А).
  it.each([
    [undefined, false, 4000],
    [undefined, true, 10000],
    ['short', true, 4000],
    ['long', false, 10000],
    [2500, false, 2500],
    ['indefinite', false, null],
  ] as const)('duration %o (action: %s) lives %o ms', (duration, hasAction, lifetime) => {
    expect(lifetimeOf(duration, hasAction)).toBe(lifetime)
  })
})
