import { describe, expect, it } from 'vitest'
import { splitMenuAttrs } from './attrs'

describe('splitMenuAttrs', () => {
  it('sends what names or identifies the menu to the surface', () => {
    const { surface, wrapper } = splitMenuAttrs({ 'id': 'actions', 'aria-label': 'Actions', 'aria-describedby': 'hint', 'role': 'menu' })

    expect(surface).toEqual({ 'id': 'actions', 'aria-label': 'Actions', 'aria-describedby': 'hint', 'role': 'menu' })
    expect(wrapper).toEqual({})
  })

  it('keeps class, style, data and listeners on the wrapper', () => {
    const onClick = () => {}
    const { surface, wrapper } = splitMenuAttrs({ 'class': 'menu', 'style': 'color: red', 'data-test': 'm', onClick })

    expect(wrapper).toEqual({ 'class': 'menu', 'style': 'color: red', 'data-test': 'm', onClick })
    expect(surface).toEqual({})
  })

  it.each([
    [{ 'aria-label': 'Actions' }, true],
    [{ 'aria-labelledby': 'title' }, true],
    [{ 'aria-describedby': 'hint' }, false],
    [{}, false],
  ])('reads %o as named by the consumer: %s', (attrs, named) => {
    expect(splitMenuAttrs(attrs).named).toBe(named)
  })
})
