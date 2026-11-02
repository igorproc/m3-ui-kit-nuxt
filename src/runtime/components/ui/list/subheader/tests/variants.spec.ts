import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MListSubheader from '../index.vue'
import MList from '../../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MListSubheader, { props, slots })

  return current as VueWrapper
}

async function inList(listProps: Record<string, unknown>, props: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render: () => h(MList, listProps, { default: () => h(MListSubheader, props) }) }))

  return (current as VueWrapper).find('.ui-list-subheader')
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list-subheader · variants', () => {
  describe('defaults', () => {
    it('renders a plain div label from the title prop, carrying only its block class', async () => {
      const wrapper = await mount({ title: 'Recent' })

      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.text()).toBe('Recent')
      expect(wrapper.classes()).toEqual(['ui-list-subheader'])
    })
  })

  describe('tag', () => {
    it.each([
      ['div', 'DIV'],
      ['li', 'LI'],
      ['p', 'P'],
    ] as const)('renders an explicit %s', async (tag, tagName) => {
      const wrapper = await mount({ tag, title: 'Recent' })

      expect(wrapper.element.tagName).toBe(tagName)
    })

    it('is an li inside a semantic list', async () => {
      const root = await inList({}, { title: 'Recent' })

      expect(root.element.tagName).toBe('LI')
    })

    it('stays a div inside a list that carries a role', async () => {
      const root = await inList({ role: 'listbox' }, { title: 'Recent' })

      expect(root.element.tagName).toBe('DIV')
    })

    it('lets an explicit tag win over the list', async () => {
      const root = await inList({}, { title: 'Recent', tag: 'p' })

      expect(root.element.tagName).toBe('P')
    })
  })

  describe('modifiers', () => {
    it('applies the sticky and inset modifiers', async () => {
      const wrapper = await mount({ title: 'Archive', sticky: true, inset: true })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-list-subheader--sticky', 'ui-list-subheader--inset']))
    })

    it('fills a sticky label with the plain surface outside a list', async () => {
      const wrapper = await mount({ title: 'Pinned', sticky: true })

      expect(wrapper.classes()).toContain('ui-list-subheader--surface')
    })

    it('takes the surface of its list only while sticky', async () => {
      const root = await inList({ surface: 'surface-container-high' }, { title: 'Pinned' })

      expect(root.classes()).toEqual(['ui-list-subheader'])
    })
  })

  describe('content', () => {
    it('prefers the default slot over the title prop', async () => {
      const wrapper = await mount({ title: 'prop title' }, { default: () => 'slot title' })

      expect(wrapper.text()).toBe('slot title')
    })

    it('renders an empty label when title and slot are absent', async () => {
      const wrapper = await mount()

      expect(wrapper.text()).toBe('')
    })
  })
})
