import { describe, expect, it } from 'vitest'
import { NuxtLink, linkAttrs, linkTag, withoutDestination } from './index'

describe('utils/link', () => {
  it('draws an enabled link with Nuxt\'s link and a disabled one with a bare anchor', () => {
    expect(linkTag(false)).toBe(NuxtLink)
    expect(linkTag(true)).toBe('a')
  })

  it('gives an enabled link its destination and nothing else', () => {
    expect(linkAttrs('/orders', false)).toEqual({ to: '/orders' })
  })

  it('gives a disabled link no destination, a link role and aria-disabled', () => {
    expect(linkAttrs('/orders', true)).toEqual({ 'role': 'link', 'aria-disabled': 'true' })
  })

  it('removes a destination the consumer passed to a disabled link', () => {
    const attrs = { 'href': '/x', 'to': '/y', 'class': 'row', 'aria-disabled': 'true' }

    expect(withoutDestination(attrs)).toEqual({ 'class': 'row', 'aria-disabled': 'true' })
  })
})
