import { describe, expect, it } from 'vitest'
import { toFormValues } from './formValues'

describe('toFormValues', () => {
  it('submits scalars as they are', () => {
    expect(toFormValues([3, 'ru', true])).toEqual(['3', 'ru', 'true'])
  })

  it('submits a whole item by its id', () => {
    expect(toFormValues([{ id: 7, name: 'Gamma' }])).toEqual(['7'])
  })

  it('submits an empty string for nothing and for an item without an id', () => {
    expect(toFormValues([null, undefined, { name: 'no id' }])).toEqual(['', '', ''])
  })
})
