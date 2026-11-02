import { describe, expect, it } from 'vitest'
import { foldForMatch, matchesQuery } from './matchRows'

describe('matchRows', () => {
  it('folds case and diacritics', () => {
    expect(foldForMatch('Zürich')).toBe('zurich')
    expect(foldForMatch('São')).toBe('sao')
  })

  it('keeps every row for an empty or blank query', () => {
    expect(matchesQuery({}, 'Berlin', '', undefined, 'contains')).toBe(true)
    expect(matchesQuery({}, 'Berlin', '   ', undefined, 'contains')).toBe(true)
  })

  it('matches anywhere or at the start', () => {
    expect(matchesQuery({}, 'Zürich', 'rich', undefined, 'contains')).toBe(true)
    expect(matchesQuery({}, 'Zürich', 'rich', undefined, 'starts-with')).toBe(false)
    expect(matchesQuery({}, 'Zürich', 'zu', undefined, 'starts-with')).toBe(true)
  })

  it('keeps every row with filter false and asks a custom filter with the query as typed', () => {
    expect(matchesQuery({}, 'Berlin', 'xyz', false, 'contains')).toBe(true)

    const seen: unknown[] = []
    const filter = (item: never, query: string, title: string) => {
      seen.push(item, query, title)
      return false
    }
    const item = { id: 1 }

    expect(matchesQuery(item, 'Berlin', ' Ber', filter, 'contains')).toBe(false)
    expect(seen).toEqual([item, ' Ber', 'Berlin'])
  })
})
