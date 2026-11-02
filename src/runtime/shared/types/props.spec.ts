import { describe, expectTypeOf, it } from 'vitest'
import type { MAccentColor, MColor, MVariant } from './props'
import type { MButtonVariant } from './components'

describe('shared prop types', () => {
  it('MVariant carries the five M3 styles and the kit\'s plain', () => {
    expectTypeOf<MVariant>().toEqualTypeOf<'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | 'plain'>()
  })

  it('the button narrows MVariant and leaves plain out', () => {
    expectTypeOf<MButtonVariant>().toEqualTypeOf<'elevated' | 'filled' | 'tonal' | 'outlined' | 'text'>()
    expectTypeOf<'plain'>().not.toMatchTypeOf<MButtonVariant>()
  })

  // W52-А: the theme's semantic roles join the colour axis.
  it('MColor carries the accent roles and the theme\'s semantic roles', () => {
    expectTypeOf<MColor>().toEqualTypeOf<'primary' | 'secondary' | 'tertiary' | 'error' | 'info' | 'success' | 'warning'>()
  })

  it('MAccentColor keeps the four accent roles and leaves the semantic ones out', () => {
    expectTypeOf<MAccentColor>().toEqualTypeOf<'primary' | 'secondary' | 'tertiary' | 'error'>()
    expectTypeOf<'info'>().not.toMatchTypeOf<MAccentColor>()
    expectTypeOf<'success'>().not.toMatchTypeOf<MAccentColor>()
    expectTypeOf<'warning'>().not.toMatchTypeOf<MAccentColor>()
  })
})
