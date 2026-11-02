import { describe, expect, it } from 'vitest'
import { searchItemKey, searchItemTitle, searchItemValue } from './items'

describe('search items', () => {
  it('reads a string as its own title, value and key', () => {
    expect(searchItemTitle('Berlin', 'title', 0)).toBe('Berlin')
    expect(searchItemValue('Berlin', 'id', 0)).toBe('Berlin')
    expect(searchItemKey('Berlin', 'Berlin', 0)).toBe('Berlin')
  })

  it('reads an object through a key or a function', () => {
    const city = { id: 7, name: 'Berlin', code: 'BER' }

    expect(searchItemTitle(city, 'name', 0)).toBe('Berlin')
    expect(searchItemTitle(city, item => String((item as typeof city).code), 0)).toBe('BER')
    expect(searchItemValue(city, 'code', 0)).toBe('BER')
    expect(searchItemValue(city, undefined, 0)).toBe(city)
    expect(searchItemKey(city, 'Berlin', 0)).toBe(7)
  })

  it('falls back to the title, then the place, for identity', () => {
    expect(searchItemKey({ name: 'Berlin' }, 'Berlin', 3)).toBe('Berlin')
    expect(searchItemKey({}, '', 3)).toBe(3)
    expect(searchItemTitle({}, 'name', 0)).toBe('')
  })
})
