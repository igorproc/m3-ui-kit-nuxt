import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import MList from '../index.vue'
import MListItem from '../item/index.vue'
import type { MListItemDensity } from '../item/props'

interface Row { id: number, name: string }

let current: { unmount: () => void } | null = null

async function mountReactive(state: { items?: Ref<Row[]>, density?: Ref<MListItemDensity> }) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({
    render: () => h(MList, { items: state.items?.value, density: state.density?.value }, {
      default: ({ item }: { item?: Row }) => h(MListItem, { headline: item?.name ?? 'Static' }),
      empty: () => 'Nothing here',
    } as never),
  }))

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list · interaction', () => {
  describe('items', () => {
    it('renders a row for an item added later', async () => {
      const items = ref<Row[]>([{ id: 1, name: 'One' }])
      const wrapper = await mountReactive({ items })

      items.value = [...items.value, { id: 2, name: 'Two' }]
      await nextTick()

      expect(wrapper.findAll('.ui-list-item').map(row => row.text())).toEqual(['One', 'Two'])
    })

    it('swaps the rows for #empty once the last item goes, and back', async () => {
      const items = ref<Row[]>([{ id: 1, name: 'One' }])
      const wrapper = await mountReactive({ items })

      items.value = []
      await nextTick()
      expect(wrapper.find('.ui-list-item').exists()).toBe(false)
      expect(wrapper.find('.ui-list__empty').text()).toBe('Nothing here')

      items.value = [{ id: 3, name: 'Three' }]
      await nextTick()
      expect(wrapper.find('.ui-list__empty').exists()).toBe(false)
      expect(wrapper.find('.ui-list-item').text()).toBe('Three')
    })

    it('keeps a row element across a reorder — rows are keyed by id', async () => {
      const items = ref<Row[]>([{ id: 1, name: 'One' }, { id: 2, name: 'Two' }])
      const wrapper = await mountReactive({ items })
      const second = wrapper.findAll('.ui-list-item')[1]!.element

      items.value = [...items.value].reverse()
      await nextTick()

      expect(wrapper.findAll('.ui-list-item')[0]!.element).toBe(second)
    })
  })

  describe('density', () => {
    it('re-scales its rows when the density changes', async () => {
      const density = ref<MListItemDensity>('default')
      const wrapper = await mountReactive({ density })

      density.value = 'compact'
      await nextTick()

      expect(wrapper.find('.ui-list-item').classes()).toContain('ui-list-item--density-compact')
    })
  })
})
