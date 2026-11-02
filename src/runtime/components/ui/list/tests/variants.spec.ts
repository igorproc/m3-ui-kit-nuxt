import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MList from '../index.vue'
import MListItem from '../item/index.vue'
import MListSubheader from '../subheader/index.vue'

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

const items = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
]

describe('m-list · variants', () => {
  describe('root', () => {
    it('renders a ul carrying only its block class', async () => {
      const wrapper = await mount()
      const list = wrapper.find('.ui-list')

      expect(list.element.tagName).toBe('UL')
      expect(list.classes()).toEqual(['ui-list'])
    })

    it('stays a div when the consumer gives it a role', async () => {
      const wrapper = await mount({ role: 'listbox' })
      const list = wrapper.find('.ui-list')

      expect(list.element.tagName).toBe('DIV')
      expect(list.attributes('role')).toBe('listbox')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('hands %s down to rows that set none', async (density) => {
      const wrapper = await mount({ density }, { default: () => h(MListItem, { headline: 'Row' }) })

      expect(wrapper.find('.ui-list-item').classes()).toContain(`ui-list-item--density-${density}`)
    })

    it('defaults its rows to the default density', async () => {
      const wrapper = await mount({}, { default: () => h(MListItem, { headline: 'Row' }) })

      expect(wrapper.find('.ui-list-item').classes()).toContain('ui-list-item--density-default')
    })

    it('lets a row keep its own density over the list', async () => {
      const wrapper = await mount({ density: 'comfortable' }, {
        default: () => [
          h(MListItem, { headline: 'Inherits' }),
          h(MListItem, { headline: 'Overrides', density: 'compact' as const }),
        ],
      })
      const rows = wrapper.findAll('.ui-list-item')

      expect(rows[0]!.classes()).toContain('ui-list-item--density-comfortable')
      expect(rows[1]!.classes()).toContain('ui-list-item--density-compact')
    })

    it('has no density modifier of its own — the scale belongs to the rows', async () => {
      const wrapper = await mount({ density: 'compact' })

      expect(wrapper.find('.ui-list').classes().some(name => name.includes('density'))).toBe(false)
    })
  })

  describe('surface', () => {
    it.each([
      'surface',
      'surface-container-lowest',
      'surface-container-low',
      'surface-container',
      'surface-container-high',
      'surface-container-highest',
    ] as const)('declares %s to a sticky subheader', async (surface) => {
      const wrapper = await mount({ surface }, { default: () => h(MListSubheader, { title: 'Pinned', sticky: true }) })

      expect(wrapper.find('.ui-list-subheader').classes()).toContain(`ui-list-subheader--${surface}`)
    })

    it('defaults to the plain surface', async () => {
      const wrapper = await mount({}, { default: () => h(MListSubheader, { title: 'Pinned', sticky: true }) })

      expect(wrapper.find('.ui-list-subheader').classes()).toContain('ui-list-subheader--surface')
    })

    it('stays transparent itself — no surface modifier on the list', async () => {
      const wrapper = await mount({ surface: 'surface-container' })

      expect(wrapper.find('.ui-list').classes()).toEqual(['ui-list'])
    })
  })

  describe('slots', () => {
    it('renders the default slot as the rows when no items are given', async () => {
      const wrapper = await mount({}, { default: () => h('li', 'Static content') })

      expect(wrapper.text()).toContain('Static content')
    })

    it('calls the scoped slot once per item with item and index', async () => {
      const wrapper = await mount({ items }, {
        default: ({ item, index }: { item: { name: string }, index: number }) => h('li', { class: 'row' }, `${index}:${item.name}`),
      })
      const rows = wrapper.findAll('.row')

      expect(rows.map(row => row.text())).toEqual(['0:Alpha', '1:Beta', '2:Gamma'])
    })

    it('renders #empty for an empty items array and never calls the default slot without an item', async () => {
      let calls = 0
      const wrapper = await mount({ items: [] }, {
        default: () => {
          calls += 1
          return h('li', 'row')
        },
        empty: () => 'Nothing here',
      })
      const empty = wrapper.find('.ui-list__empty')

      expect(calls).toBe(0)
      expect(empty.element.tagName).toBe('LI')
      expect(empty.text()).toBe('Nothing here')
    })

    it('draws #empty as a div in a list that carries a role', async () => {
      const wrapper = await mount({ items: [], role: 'listbox' }, { empty: () => 'Nothing here' })

      expect(wrapper.find('.ui-list__empty').element.tagName).toBe('DIV')
    })

    it('renders nothing for an empty items array without #empty', async () => {
      const wrapper = await mount({ items: [] })

      expect(wrapper.find('.ui-list').element.children).toHaveLength(0)
    })

    it('leaves #empty out while there are items', async () => {
      const wrapper = await mount({ items }, { default: () => h('li', 'row'), empty: () => 'Nothing here' })

      expect(wrapper.find('.ui-list__empty').exists()).toBe(false)
    })
  })
})
