import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MDivider from '../index.vue'
import MList from '../../list/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MDivider, { props })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-divider · variants', () => {
  describe('orientation', () => {
    it.each(['horizontal', 'vertical'] as const)('maps %s onto its own modifier', async (orientation) => {
      const wrapper = await mount({ orientation })

      expect(wrapper.classes()).toContain(`ui-divider--${orientation}`)
    })

    it('defaults to a full-length horizontal line in a div', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.classes()).toEqual(['ui-divider', 'ui-divider--horizontal'])
    })
  })

  describe('inset', () => {
    it.each(['start', 'center', 'end'] as const)('applies the %s inset', async (inset) => {
      const wrapper = await mount({ inset })

      expect(wrapper.classes()).toContain(`ui-divider--inset-${inset}`)
    })

    it.each(['start', 'center', 'end'] as const)('keeps the %s inset on a vertical line, along its own axis', async (inset) => {
      const wrapper = await mount({ inset, orientation: 'vertical' })

      expect(wrapper.classes()).toEqual(['ui-divider', 'ui-divider--vertical', `ui-divider--inset-${inset}`])
    })

    it('runs the full length without an inset', async () => {
      const wrapper = await mount()

      expect(wrapper.classes().some(name => name.startsWith('ui-divider--inset'))).toBe(false)
    })
  })

  describe('placement', () => {
    it('is an li among the items of a semantic list', async () => {
      current = await mountSuspended(defineComponent({ render: () => h(MList, null, { default: () => h(MDivider) }) }))

      expect((current as VueWrapper).find('.ui-divider').element.tagName).toBe('LI')
    })

    it('stays a div inside a list that carries a role', async () => {
      current = await mountSuspended(defineComponent({ render: () => h(MList, { role: 'listbox' }, { default: () => h(MDivider) }) }))

      expect((current as VueWrapper).find('.ui-divider').element.tagName).toBe('DIV')
    })

    it('renders no content — the line is the border of an empty box', async () => {
      const wrapper = await mount()

      expect(wrapper.element.childNodes).toHaveLength(0)
    })
  })
})
