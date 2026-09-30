import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MList from './index.vue'
import MListItem from './item/index.vue'

describe('m-list', () => {
  it('renders a container with the ui-list class', async () => {
    const wrapper = await mountSuspended(MList)

    expect(wrapper.classes()).toContain('ui-list')
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

    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MList, { items }, {
        default: ({ item, index }: { item: { name: string }, index: number }) =>
          h('div', { class: 'row' }, `${index}:${item.name}`),
      }),
    }))

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toBe('0:Alpha')
    expect(rows[2]!.text()).toBe('2:Gamma')
  })

  it('passes its density down to rows that do not set one', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MList, { density: 'comfortable' as const }, {
        default: () => [
          h(MListItem, { headline: 'Inherits' }),
          h(MListItem, { headline: 'Overrides', density: 'compact' as const }),
        ],
      }),
    }))

    const rows = wrapper.findAll('.ui-list-item')
    expect(rows[0]!.classes()).toContain('ui-list-item--density-comfortable')
    expect(rows[1]!.classes()).toContain('ui-list-item--density-compact')
  })
})
