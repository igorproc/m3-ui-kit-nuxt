import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MList from './index.vue'
import MListItem from './item/index.vue'
import MListSubheader from './subheader/index.vue'
import MDivider from '../divider/index.vue'

const mountList = (props: Record<string, unknown>, slots: Record<string, (scope: never) => unknown>) =>
  mountSuspended(defineComponent({ render: () => h(MList, props, slots as never) }))

describe('m-list', () => {
  it('renders a ul with the ui-list class', async () => {
    const wrapper = await mountSuspended(MList)

    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.classes()).toContain('ui-list')
  })

  it('stays a div when the consumer gives it a role', async () => {
    const wrapper = await mountSuspended(MList, { attrs: { role: 'listbox' } })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBe('listbox')
  })

  it('renders the default slot when no items are provided', async () => {
    const wrapper = await mountSuspended(MList, {
      slots: { default: () => 'Empty content' },
    })

    expect(wrapper.text()).toContain('Empty content')
  })

  it('renders the scoped slot once per item with item + index', async () => {
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
      { id: 'c', name: 'Gamma' },
    ]

    const wrapper = await mountList({ items }, {
      default: ({ item, index }: { item: { name: string }, index: number }) =>
        h('li', { class: 'row' }, `${index}:${item.name}`),
    })

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toBe('0:Alpha')
    expect(rows[2]!.text()).toBe('2:Gamma')
  })

  it('renders #empty for an empty items array and never calls the default slot without an item', async () => {
    let calls = 0
    const wrapper = await mountList({ items: [] }, {
      default: () => {
        calls += 1
        return h('li', 'row')
      },
      empty: () => 'Nothing here',
    })

    expect(calls).toBe(0)
    const empty = wrapper.find('.ui-list__empty')
    expect(empty.element.tagName).toBe('LI')
    expect(empty.text()).toBe('Nothing here')
  })

  it('renders nothing for an empty items array without #empty', async () => {
    const wrapper = await mountList({ items: [] }, {})

    expect(wrapper.find('.ui-list').element.children).toHaveLength(0)
  })

  it('passes its density down to rows that do not set one', async () => {
    const wrapper = await mountList({ density: 'comfortable' }, {
      default: () => [
        h(MListItem, { headline: 'Inherits' }),
        h(MListItem, { headline: 'Overrides', density: 'compact' as const }),
      ],
    })

    const rows = wrapper.findAll('.ui-list-item')
    expect(rows[0]!.classes()).toContain('ui-list-item--density-comfortable')
    expect(rows[1]!.classes()).toContain('ui-list-item--density-compact')
  })

  it('makes every direct child an li: rows, subheaders and dividers', async () => {
    const wrapper = await mountList({}, {
      default: () => [
        h(MListSubheader, { title: 'Recent' }),
        h(MListItem, { headline: 'Static' }),
        h(MDivider),
        h(MListItem, { headline: 'Action', tag: 'button' }),
      ],
    })

    const children = [...wrapper.find('.ui-list').element.children]
    expect(children.map(child => child.tagName)).toEqual(['LI', 'LI', 'LI', 'LI'])
    expect(children[0]!.getAttribute('role')).toBeNull()
    expect(children[2]!.getAttribute('aria-hidden')).toBe('true')
    expect(children[3]!.querySelector(':scope > button.ui-list-item')).not.toBeNull()
  })

  it('keeps the rows of a role-bearing list as they are', async () => {
    const wrapper = await mountList({ role: 'listbox' }, {
      default: () => [
        h(MListItem, { 'headline': 'Option', 'interactive': true, 'selected': true, 'role': 'option', 'aria-selected': 'true' }),
        h(MDivider),
      ],
    })

    const row = wrapper.find('.ui-list-item')
    expect(row.element.tagName).toBe('DIV')
    expect(row.attributes('role')).toBe('option')
    expect(row.attributes('aria-pressed')).toBeUndefined()
    expect(wrapper.find('.ui-list__row').exists()).toBe(false)

    const divider = wrapper.find('.ui-divider')
    expect(divider.element.tagName).toBe('DIV')
    expect(divider.attributes('aria-hidden')).toBe('true')
    expect(divider.attributes('role')).toBeUndefined()
  })

  it('declares the surface it sits on to a sticky subheader', async () => {
    const wrapper = await mountList({ surface: 'surface-container-low' }, {
      default: () => h(MListSubheader, { title: 'Pinned', sticky: true }),
    })

    expect(wrapper.find('.ui-list-subheader').classes()).toContain('ui-list-subheader--surface-container-low')
  })
})
