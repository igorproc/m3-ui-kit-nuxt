import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MSystemBar from '../index.vue'
import { mSystemBarProps } from '../props'

let current: { unmount: () => void } | null = null

async function mount(options: Parameters<typeof mountSuspended>[1] = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MSystemBar, options)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-system-bar · variants', () => {
  describe('defaults', () => {
    it('is sticky by default', () => {
      expect(mSystemBarProps.sticky.default).toBe(true)
    })

    it('renders the bar container', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toEqual(['ui-system-bar'])
    })
  })

  describe('slots', () => {
    it('renders default slot content inside the text element', async () => {
      const wrapper = await mount({ slots: { default: () => 'status' } })

      expect(wrapper.find('.ui-system-bar__text').text()).toBe('status')
    })

    it('wraps the prepend and append slots in their icon elements, in reading order', async () => {
      const wrapper = await mount({
        slots: {
          prepend: () => h('i', { 'data-testid': 'start-icon' }),
          default: () => 'status',
          append: () => h('i', { 'data-testid': 'end-icon' }),
        },
      })
      const parts = Array.from((wrapper.element as HTMLElement).children, part => part.className)

      expect(parts).toEqual(['ui-system-bar__prepend', 'ui-system-bar__text', 'ui-system-bar__append'])
      expect(wrapper.find('.ui-system-bar__prepend [data-testid="start-icon"]').exists()).toBe(true)
      expect(wrapper.find('.ui-system-bar__append [data-testid="end-icon"]').exists()).toBe(true)
    })

    it.each(['prepend', 'default', 'append'] as const)('renders only the %s part when it is the only slot', async (slot) => {
      const wrapper = await mount({ slots: { [slot]: () => 'x' } })
      const part = slot === 'default' ? 'text' : slot

      expect(Array.from((wrapper.element as HTMLElement).children, el => el.className)).toEqual([`ui-system-bar__${part}`])
    })

    it('renders no empty elements for absent slots', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-system-bar__prepend').exists()).toBe(false)
      expect(wrapper.find('.ui-system-bar__text').exists()).toBe(false)
      expect(wrapper.find('.ui-system-bar__append').exists()).toBe(false)
    })
  })

  describe('placement', () => {
    it.each([true, false])('outside a layout is not anchored, whatever sticky is (%s)', async (sticky) => {
      const wrapper = await mount({ props: { sticky } })

      expect(wrapper.classes()).not.toContain('ui-system-bar--anchored')
      expect(wrapper.attributes('data-m3-zone')).toBeUndefined()
      expect((wrapper.element as HTMLElement).style.gridArea).toBe('')
    })
  })

  describe('attributes', () => {
    it('passes fallthrough attributes to the root', async () => {
      const wrapper = await mount({ attrs: { 'data-test': 'bar', 'aria-label': 'Device status' } })

      expect(wrapper.attributes('data-test')).toBe('bar')
      expect(wrapper.attributes('aria-label')).toBe('Device status')
    })
  })
})
