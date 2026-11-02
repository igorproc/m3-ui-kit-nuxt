import { describe, expect, it } from 'vitest'
import { isImeKeydown } from './ime'

const key = (init: KeyboardEventInit & { keyCode?: number }) => new KeyboardEvent('keydown', init)

describe('isImeKeydown', () => {
  it('reads a keydown during composition as the input method\'s', () => {
    expect(isImeKeydown(key({ key: 'ArrowDown', isComposing: true }))).toBe(true)
  })

  it('reads Safari\'s confirming Enter, flagged by keyCode 229 only', () => {
    expect(isImeKeydown(key({ key: 'Enter', keyCode: 229 }))).toBe(true)
  })

  it('leaves a 229 that is not an Enter alone: virtual keyboards send it for characters', () => {
    expect(isImeKeydown(key({ key: 'a', keyCode: 229 }))).toBe(false)
  })

  it('leaves a plain Enter alone', () => {
    expect(isImeKeydown(key({ key: 'Enter', keyCode: 13 }))).toBe(false)
  })
})
