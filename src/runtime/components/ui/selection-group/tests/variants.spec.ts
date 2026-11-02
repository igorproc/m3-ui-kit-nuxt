import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import type { SelectionGroupSlot } from '#kit/composables/selection/context'
import type { ItemScope, Plan } from './helpers'
import { buttonFor, dataGroup, itemButton, mountGroup, plans, selectedValues, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-selection-group · variants', () => {
  describe('data-driven items', () => {
    it('renders one item per entry through the item slot, in data order', async () => {
      const { wrapper } = await dataGroup()

      expect(wrapper.findAll('.item').map(item => item.text())).toEqual(['A', 'B', 'C'])
    })

    it('hands each item its data and index next to its state', async () => {
      const seen: Array<{ title: string, index: number }> = []
      await dataGroup({}, {
        item: (scope: ItemScope) => {
          seen.push({ title: scope.item!.title, index: scope.index! })
          return itemButton(scope)
        },
      })

      expect(seen.slice(0, 3)).toEqual([{ title: 'A', index: 0 }, { title: 'B', index: 1 }, { title: 'C', index: 2 }])
    })

    it.each([
      ['a key', 'id'],
      ['a getter', (plan: Plan) => plan.id],
    ])('resolves item values through %s', async (_, itemValue) => {
      const { wrapper } = await dataGroup({ itemValue, modelValue: 'b' })

      expect(selectedValues(wrapper)).toEqual(['b'])
    })

    it('uses the whole item as its value without itemValue', async () => {
      const { wrapper, model } = await mountGroup({ items: ['x', 'y'], modelValue: 'y' }, {
        item: (scope: ItemScope) => itemButton(scope),
      })

      expect(selectedValues(wrapper)).toEqual(['y'])
      await buttonFor(wrapper, 'x').trigger('click')
      expect(model.value).toBe('x')
    })

    it.each([
      ['a key', 'off'],
      ['a getter', (plan: Plan) => Boolean(plan.off)],
    ])('resolves disabled items through %s', async (_, itemDisabled) => {
      const items = plans.map(plan => ({ ...plan, off: plan.id === 'c' }))
      const { wrapper } = await dataGroup({ items, itemDisabled })

      expect(buttonFor(wrapper, 'c').attributes('data-reason')).toBe('disabled')
      expect(buttonFor(wrapper, 'a').attributes('data-reason')).toBe('null')
    })

    it('renders the empty slot for an empty item list, with the group state', async () => {
      const { wrapper } = await dataGroup({ items: [] }, {
        empty: (slot: { selected: unknown[] }) => h('p', { class: 'empty' }, `none:${slot.selected.length}`),
      })

      expect(wrapper.find('.empty').text()).toBe('none:0')
      expect(wrapper.findAll('.item')).toHaveLength(0)
    })

    it('renders no empty slot while there are items', async () => {
      const { wrapper } = await dataGroup({}, { empty: () => h('p', { class: 'empty' }) })

      expect(wrapper.find('.empty').exists()).toBe(false)
    })
  })

  describe('default slot', () => {
    it('renders the default slot next to data-driven items', async () => {
      const { wrapper } = await dataGroup({}, { default: () => h('header', { class: 'head' }, 'Plans') })

      expect(wrapper.find('.head').exists()).toBe(true)
      expect(wrapper.findAll('.item')).toHaveLength(3)
    })
  })

  describe('rows in the default scope (N4)', () => {
    const wrapped = (scope: SelectionGroupSlot<string>) => h('div', { class: 'wrapper', ...scope.groupAttrs }, [h(scope.rows!)])

    it('puts the data rows inside the consumer’s wrapper, once', async () => {
      const { wrapper } = await dataGroup({ pattern: 'radio', modelValue: 'b' }, { default: wrapped })

      expect(wrapper.find('.wrapper').attributes('role')).toBe('radiogroup')
      expect(wrapper.findAll('.wrapper .item')).toHaveLength(3)
      expect(wrapper.findAll('.item')).toHaveLength(3)
    })

    it('keeps the rows selectable and in step once they are inside', async () => {
      const { wrapper, model } = await dataGroup({ pattern: 'radio' }, { default: wrapped })

      await buttonFor(wrapper, 'c').trigger('click')

      expect(model.value).toBe('c')
      expect(selectedValues(wrapper)).toEqual(['c'])
    })

    it('renders the empty slot in place of the rows when there are no items', async () => {
      const { wrapper } = await mountGroup({ items: [] }, {
        default: wrapped,
        empty: () => h('p', { class: 'empty' }, 'None'),
      })

      expect(wrapper.find('.wrapper .empty').exists()).toBe(true)
      expect(wrapper.findAll('.empty')).toHaveLength(1)
    })

    it('offers no rows outside data mode', async () => {
      let rows: unknown = 'unset'
      await mountGroup({}, {
        default: (scope: SelectionGroupSlot<string>) => {
          rows = scope.rows
          return null
        },
      })

      expect(rows).toBeUndefined()
    })

    it('keeps the rows out of a spread of the scope', async () => {
      let keys: string[] = []
      await dataGroup({}, {
        default: (scope: SelectionGroupSlot<string>) => {
          keys = Object.keys({ ...scope })
          return null
        },
      })

      expect(keys).not.toContain('rows')
    })
  })

  describe('headless', () => {
    it('renders no element of its own — the markup is the consumer’s', async () => {
      const { wrapper } = await dataGroup()

      const markup = wrapper.html().replace(/<!--[\s\S]*?-->/g, '').trim()

      expect(markup.startsWith('<button class="item"')).toBe(true)
      expect(wrapper.findAll('.item')).toHaveLength(3)
    })
  })
})
