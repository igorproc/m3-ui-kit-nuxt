import { describe, expect, it } from 'vitest'
import { ICONS } from '#kit/shared/constants/icons'
import { resolveIconName } from './iconName'
import { isKnownKitGlyph } from './knownGlyphs'

describe('isKnownKitGlyph', () => {
  it('knows every kit glyph and its filled pair', () => {
    for (const value of Object.values(ICONS)) {
      expect(isKnownKitGlyph(value), value).toBe(true)
      expect(isKnownKitGlyph(resolveIconName(value, true)), value).toBe(true)
    }
  })

  it('rejects a well-formed name the ic set does not have', () => {
    expect(isKnownKitGlyph('ic:outline-nonexistent')).toBe(false)
  })

  it('does not judge another collection', () => {
    expect(isKnownKitGlyph('mdi:anything-at-all')).toBe(true)
  })
})
