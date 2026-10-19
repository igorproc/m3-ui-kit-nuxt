import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

describe('useTimer', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.doUnmock('#kit/shared/constants/globals')
    vi.resetModules()
  })

  it('fires and repeats in the browser, and stops with its scope', async () => {
    vi.useFakeTimers()
    const { useTimer } = await import('./useTimer')
    const handler = vi.fn()
    const scope = effectScope()

    scope.run(() => useTimer(handler, { duration: 100, repeat: true }).start())
    vi.advanceTimersByTime(250)
    expect(handler).toHaveBeenCalledTimes(2)

    scope.stop()
    vi.advanceTimersByTime(500)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  // A server render never unmounts, so a repeating timer started there would
  // run for the life of the process (LDG.B-1).
  it('schedules nothing off the browser', async () => {
    vi.doMock('#kit/shared/constants/globals', () => ({ IN_BROWSER: false }))
    vi.useFakeTimers()
    const { useTimer } = await import('./useTimer')
    const handler = vi.fn()

    const timer = effectScope().run(() => useTimer(handler, { duration: 100, repeat: true }))!
    timer.start()

    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(500)
    expect(handler).not.toHaveBeenCalled()
  })
})
