import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MList from './index.vue'

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
})
