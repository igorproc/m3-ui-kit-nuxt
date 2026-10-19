import { describe, expect, it } from 'vitest'
import { panelHasContent, panelState } from './panelState'

describe('panelState', () => {
  it.each([
    [{ rows: 3, loading: true, items: 3, queryReady: false }, 'rows'],
    [{ rows: 0, loading: true, items: 3, queryReady: false }, 'hint'],
    [{ rows: 0, loading: true, items: 0, queryReady: true }, 'loading'],
    [{ rows: 0, loading: false, items: 0, queryReady: true }, 'empty'],
    [{ rows: 0, loading: false, items: 4, queryReady: true }, 'no-results'],
  ] as const)('%o → %s', (input, state) => {
    expect(panelState(input)).toBe(state)
  })
})

describe('panelHasContent', () => {
  const none = () => false

  it('always has something with rows or a progress bar', () => {
    expect(panelHasContent('rows', none)).toBe(true)
    expect(panelHasContent('loading', none)).toBe(true)
  })

  it('has a message state only when its slot or its phrase is there', () => {
    expect(panelHasContent('empty', none)).toBe(false)
    expect(panelHasContent('empty', none, { empty: 'Nothing' })).toBe(true)
    expect(panelHasContent('no-results', name => name === 'no-results')).toBe(true)
    expect(panelHasContent('no-results', none, { empty: 'Nothing' })).toBe(false)
  })

  it('has a hint only through its slot: the kit has no words for it', () => {
    expect(panelHasContent('hint', none, { empty: 'x', noResults: 'y' })).toBe(false)
    expect(panelHasContent('hint', name => name === 'hint')).toBe(true)
  })
})
