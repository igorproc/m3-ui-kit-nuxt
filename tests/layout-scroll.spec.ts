import { describe, expect, it } from 'vitest'
import { createScrollLock } from '../app/composables/layout/scroll'

const makeTargets = () => {
  const doc = document.createElement('div')
  const main = document.createElement('main')
  doc.style.overflow = 'auto'
  return { doc, main }
}

describe('createScrollLock', () => {
  it('locks every target and restores original inline overflow', () => {
    const { doc, main } = makeTargets()
    const lock = createScrollLock(() => [doc, main])

    lock(true)
    expect(doc.style.overflow).toBe('hidden')
    expect(main.style.overflow).toBe('hidden')

    lock(false)
    expect(doc.style.overflow).toBe('auto')
    expect(main.style.overflow).toBe('')
  })

  it('is ref-counted: two consumers → one physical lock', () => {
    const { doc, main } = makeTargets()
    const lock = createScrollLock(() => [doc, main])

    lock(true)
    lock(true)
    lock(false)
    expect(doc.style.overflow).toBe('hidden')

    lock(false)
    expect(doc.style.overflow).toBe('auto')
  })

  it('ignores unbalanced release', () => {
    const { doc } = makeTargets()
    const lock = createScrollLock(() => [doc])

    lock(false)
    expect(doc.style.overflow).toBe('auto')

    lock(true)
    expect(doc.style.overflow).toBe('hidden')
  })

  it('skips null targets', () => {
    const { doc } = makeTargets()
    const lock = createScrollLock(() => [doc, null])

    lock(true)
    expect(doc.style.overflow).toBe('hidden')
    lock(false)
  })
})
