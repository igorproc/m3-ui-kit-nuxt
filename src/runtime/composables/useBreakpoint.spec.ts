import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useNuxtApp, useState } from '#app'
import { useBreakpoint } from './useBreakpoint'

const viewport = () => useState<{ width: number, height: number }>('md:viewport')

describe('useBreakpoint · window classes', () => {
  let initial = 0

  beforeEach(() => {
    initial = viewport().value.width
  })

  afterEach(() => {
    viewport().value = { ...viewport().value, width: initial }
  })

  it.each([
    [360, 'compact'],
    [1024, 'medium'],
    [1024, 'expanded'],
    [1440, 'large'],
    [2560, 'extraLarge'],
  ] as const)('a %ipx window is %s', async (width, windowClass) => {
    viewport().value = { ...viewport().value, width }
    await nextTick()

    expect(useBreakpoint().is.value[windowClass]).toBe(true)
  })

  // The classes ride on the kit's ranges, so they agree with what m-layout keeps.
  it('agrees with the ranges m-layout carves by', async () => {
    const { breakpoints } = useNuxtApp().$material.breakpoints

    for (const width of [breakpoints['tablet-xs'] - 1, breakpoints['tablet-xs'], breakpoints['desktop-xs'] - 1, breakpoints['desktop-xs']]) {
      viewport().value = { ...viewport().value, width }
      await nextTick()
      const { is } = useBreakpoint()

      expect(is.value.compact, String(width)).toBe(width < breakpoints['tablet-xs'])
      expect(is.value.large || is.value.extraLarge, String(width)).toBe(width >= breakpoints['desktop-xs'])
    }
  })

  it('keeps the kit flags beside the classes', () => {
    const { is } = useBreakpoint()

    expect(typeof is.value.tabletXs).toBe('boolean')
    expect(typeof is.value.medium).toBe('boolean')
  })
})
