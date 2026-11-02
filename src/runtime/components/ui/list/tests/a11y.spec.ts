import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MList from '../index.vue'
import MListItem from '../item/index.vue'
import MListSubheader from '../subheader/index.vue'
import MDivider from '../../divider/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Record<string, (scope: never) => unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render: () => h(MList, props, slots as never) }))

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list · a11y', () => {
  describe('list semantics', () => {
    it('relies on the native list role rather than an invented one', async () => {
      const wrapper = await mount()

      expect(wrapper.find('ul.ui-list').attributes('role')).toBeUndefined()
    })

    it('makes every direct child an li: rows, subheaders and dividers', async () => {
      const wrapper = await mount({}, {
        default: () => [
          h(MListSubheader, { title: 'Recent' }),
          h(MListItem, { headline: 'Static' }),
          h(MDivider),
          h(MListItem, { headline: 'Action', tag: 'button' }),
        ],
      })
      const children = [...wrapper.find('.ui-list').element.children]

      expect(children.map(child => child.tagName)).toEqual(['LI', 'LI', 'LI', 'LI'])
      expect(children.every(child => child.getAttribute('role') === null)).toBe(true)
    })

    it('puts an interactive row inside its li instead of turning the li into a button', async () => {
      const wrapper = await mount({}, { default: () => h(MListItem, { headline: 'Action', tag: 'button' }) })
      const item = wrapper.find('.ui-list__row')

      expect(item.element.tagName).toBe('LI')
      expect(item.element.querySelector(':scope > button.ui-list-item')).not.toBeNull()
    })

    it('hides a divider among list items — a separator may not sit there', async () => {
      const wrapper = await mount({}, { default: () => [h(MListItem, { headline: 'A' }), h(MDivider), h(MListItem, { headline: 'B' })] })
      const divider = wrapper.find('.ui-divider')

      expect(divider.attributes('aria-hidden')).toBe('true')
      expect(divider.attributes('role')).toBeUndefined()
    })

    it('keeps #empty a list item, read in order like any other', async () => {
      const wrapper = await mount({ items: [] }, { empty: () => 'Nothing here' })
      const empty = wrapper.find('.ui-list__empty')

      expect(empty.element.tagName).toBe('LI')
      expect(empty.attributes('role')).toBeUndefined()
    })
  })

  describe('role-bearing list', () => {
    it('keeps the rows of a listbox as their owner set them', async () => {
      const wrapper = await mount({ role: 'listbox' }, {
        default: () => [
          h(MListItem, { 'headline': 'Option', 'interactive': true, 'selected': true, 'role': 'option', 'aria-selected': 'true' }),
          h(MDivider),
        ],
      })
      const row = wrapper.find('.ui-list-item')

      expect(row.element.tagName).toBe('DIV')
      expect(row.attributes('role')).toBe('option')
      expect(row.attributes('aria-selected')).toBe('true')
      expect(row.attributes('aria-pressed')).toBeUndefined()
      expect(wrapper.find('.ui-list__row').exists()).toBe(false)
    })

    it('keeps its divider decorative and out of the option list', async () => {
      const wrapper = await mount({ role: 'listbox' }, { default: () => h(MDivider) })
      const divider = wrapper.find('.ui-divider')

      expect(divider.element.tagName).toBe('DIV')
      expect(divider.attributes('aria-hidden')).toBe('true')
      expect(divider.attributes('role')).toBeUndefined()
    })

    it('passes consumer ARIA through to the root', async () => {
      const wrapper = await mount({ 'role': 'listbox', 'aria-label': 'Fruits' })

      expect(wrapper.find('.ui-list').attributes('aria-label')).toBe('Fruits')
    })
  })
})
