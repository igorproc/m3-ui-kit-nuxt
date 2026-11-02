import { afterEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { __resetScrollLock, useScrollLock } from '#kit/composables/overlay/useScrollLock'
import { createScrollLock } from '#kit/utils/layout/scroll'
import { holdOverflow, releaseOverflow } from './overflowLock'

const root = document.documentElement

afterEach(() => {
  __resetScrollLock()
  root.style.overflow = ''
})

describe('overflowLock', () => {
  it('keeps the element hidden until the last hold goes, then restores what the first found', () => {
    const el = document.createElement('div')
    el.style.overflow = 'auto'

    holdOverflow(el)
    holdOverflow(el)
    releaseOverflow(el)
    expect(el.style.overflow).toBe('hidden')

    releaseOverflow(el)
    expect(el.style.overflow).toBe('auto')
  })

  it('ignores a release without a hold', () => {
    const el = document.createElement('div')

    releaseOverflow(el)
    expect(el.style.overflow).toBe('')
  })

  it('lets the overlay lock and the layout lock cross without freezing the page', () => {
    const scope = effectScope()
    const overlay = scope.run(() => useScrollLock())!
    const layout = createScrollLock(() => [root])

    overlay.lock(false)
    layout(true)
    overlay.unlock()
    expect(root.style.overflow).toBe('hidden')

    layout(false)
    expect(root.style.overflow).toBe('')
    scope.stop()
  })
})
