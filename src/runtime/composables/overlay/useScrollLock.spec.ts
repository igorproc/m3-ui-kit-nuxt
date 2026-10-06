import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { __resetScrollLock, useScrollLock } from './useScrollLock'

const root = document.documentElement

/** Pretends the page shows a classic scrollbar of `width` px. */
function withScrollbar(width: number) {
  Object.defineProperty(root, 'clientWidth', { configurable: true, get: () => window.innerWidth - width })
}

function lockInScope(reserveScrollBarGap = true) {
  const scope = effectScope()
  const lock = scope.run(() => useScrollLock())!
  lock.lock(reserveScrollBarGap)
  return { lock, scope }
}

afterEach(() => {
  __resetScrollLock()
  Reflect.deleteProperty(root, 'clientWidth')
  vi.unstubAllGlobals()
})

describe('useScrollLock', () => {
  it('hides the viewport scrollbar and reserves its width with scrollbar-gutter', () => {
    withScrollbar(15)
    const { scope } = lockInScope()

    expect(root.style.overflow).toBe('hidden')
    expect(root.style.scrollbarGutter).toBe('stable')
    expect(document.body.style.paddingRight).toBe('')
    scope.stop()
  })

  // A stable gutter on a page without a scrollbar would add width, not keep it.
  it('reserves nothing when there is no scrollbar to replace', () => {
    withScrollbar(0)
    const { scope } = lockInScope()

    expect(root.style.overflow).toBe('hidden')
    expect(root.style.scrollbarGutter).toBe('')
    scope.stop()
  })

  it('falls back to body padding without scrollbar-gutter support', () => {
    vi.stubGlobal('CSS', { supports: () => false })
    withScrollbar(15)
    const { scope } = lockInScope()

    expect(root.style.scrollbarGutter).toBe('')
    expect(document.body.style.paddingRight).toBe('15px')
    scope.stop()
  })

  it('keeps the lock until the last holder releases, then restores', () => {
    withScrollbar(15)
    const outer = lockInScope()
    const inner = lockInScope()

    inner.lock.unlock()
    expect(root.style.overflow).toBe('hidden')

    outer.lock.unlock()
    expect(root.style.overflow).toBe('')
    expect(root.style.scrollbarGutter).toBe('')
    outer.scope.stop()
    inner.scope.stop()
  })
})
