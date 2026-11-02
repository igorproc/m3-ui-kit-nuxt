import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import type { MVariant } from '#kit/shared/types/props'
import MSurface from '../index.vue'
import type { MSurfaceVariant } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MSurface, { props, slots, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-surface · variants', () => {
  it('renders a div with the plain preset and no corner by default', async () => {
    const wrapper = await mount()

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(['ui-surface', 'ui-surface--plain', 'ui-surface--shape-none'])
  })

  describe('variant', () => {
    // B13.2a/decisions: the surface presets are a subset of the kit's one variant axis.
    it('narrows the kit variant axis instead of declaring its own', () => {
      // Holds only while every preset, `plain` included, is a member of MVariant.
      expectTypeOf<MSurfaceVariant>().toEqualTypeOf<'plain' | 'filled' | 'elevated' | 'outlined'>()
      expectTypeOf<MSurfaceVariant>().toExtend<MVariant>()
    })

    it.each(['plain', 'filled', 'elevated', 'outlined'] as const)('maps %s onto its own modifier and nothing else', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toEqual(['ui-surface', `ui-surface--${variant}`, 'ui-surface--shape-none'])
    })
  })

  describe('shape', () => {
    it.each(['none', 'extra-small', 'small', 'medium', 'large', 'extra-large', 'extra-large-top', 'full'] as const)(
      'maps the %s corner onto its own modifier',
      async (shape) => {
        const wrapper = await mount({ shape })

        expect(wrapper.classes()).toContain(`ui-surface--shape-${shape}`)
      },
    )

    it('keeps variant and shape independent', async () => {
      const wrapper = await mount({ variant: 'outlined', shape: 'medium' })

      expect(wrapper.classes()).toEqual(['ui-surface', 'ui-surface--outlined', 'ui-surface--shape-medium'])
    })
  })

  describe('tag', () => {
    it.each(['section', 'aside', 'article', 'li'])('renders on a %s', async (tag) => {
      const wrapper = await mount({ tag })

      expect(wrapper.element.tagName).toBe(tag.toUpperCase())
    })
  })

  describe('content', () => {
    it('renders the default slot', async () => {
      const wrapper = await mount({}, { default: () => 'Body' })

      expect(wrapper.text()).toBe('Body')
    })

    it('merges a consumer class with its own preset classes', async () => {
      const wrapper = await mount({ variant: 'outlined', shape: 'medium' }, undefined, { class: 'ui-alert' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-alert', 'ui-surface', 'ui-surface--outlined', 'ui-surface--shape-medium']))
    })
  })
})
