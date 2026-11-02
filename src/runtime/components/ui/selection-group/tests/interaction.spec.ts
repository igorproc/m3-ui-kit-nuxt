import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { SelectionGroupSlot, SelectionItemState } from '#kit/composables/selection/context'
import { MSelectionGroup, MSelectionItem, buttonFor, dataGroup, itemButton, manualGroup, selectedValues, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-selection-group · interaction', () => {
  describe('single selection', () => {
    it('selects the item matching a preset model at mount', async () => {
      const { wrapper } = await dataGroup({ modelValue: 'a' })

      expect(selectedValues(wrapper)).toEqual(['a'])
    })

    it('replaces the selection and emits the raw value', async () => {
      const { wrapper, model } = await dataGroup({ modelValue: 'a' })

      await buttonFor(wrapper, 'b').trigger('click')
      await nextTick()

      expect(model.value).toBe('b')
      expect(selectedValues(wrapper)).toEqual(['b'])
    })

    it('unselects to an empty model without mandatory', async () => {
      const { wrapper, model } = await dataGroup({ modelValue: 'a' })

      await buttonFor(wrapper, 'a').trigger('click')
      await nextTick()

      expect(model.value).toBeUndefined()
    })

    it('keeps the last selected item with mandatory', async () => {
      const { wrapper, model } = await dataGroup({ mandatory: true, modelValue: 'a' })

      await buttonFor(wrapper, 'a').trigger('click')
      await nextTick()

      expect(model.value).toBe('a')
    })

    it('follows a model the parent changes', async () => {
      const { wrapper, model } = await dataGroup({ modelValue: 'a' })

      model.value = 'c'
      await nextTick()
      await nextTick()

      expect(selectedValues(wrapper)).toEqual(['c'])
    })
  })

  describe('multiple selection', () => {
    it('accumulates values into an array', async () => {
      const { wrapper, model } = await dataGroup({ multiple: true, modelValue: ['a'] })

      await buttonFor(wrapper, 'b').trigger('click')
      await nextTick()

      expect(model.value).toEqual(['a', 'b'])
    })

    it('keeps a preset in its own order: the same values reordered are no change', async () => {
      const { wrapper, model } = await dataGroup({ multiple: true, modelValue: ['c', 'a'] })
      await nextTick()

      expect(selectedValues(wrapper)).toEqual(['a', 'c'])
      expect(model.value).toEqual(['c', 'a'])
    })

    it('emits a real change in DOM order, as a native multiple select', async () => {
      const { wrapper, model } = await dataGroup({ multiple: true, modelValue: ['c', 'a'] })

      await buttonFor(wrapper, 'b').trigger('click')
      await nextTick()

      expect(model.value).toEqual(['a', 'b', 'c'])
    })

    it('blocks unselected items once max is reached and refuses them', async () => {
      const { wrapper, model } = await dataGroup({ multiple: true, max: 2, modelValue: ['a', 'b'] })
      const c = buttonFor(wrapper, 'c')

      expect(c.attributes('data-blocked')).toBe('true')
      expect(c.attributes('data-reason')).toBe('max')

      await c.trigger('click')
      await nextTick()

      expect(model.value).toEqual(['a', 'b'])
    })

    it('frees blocked items when a selection is released', async () => {
      const { wrapper } = await dataGroup({ multiple: true, max: 1, modelValue: ['a'] })

      await buttonFor(wrapper, 'a').trigger('click')
      await nextTick()

      expect(buttonFor(wrapper, 'b').attributes('data-blocked')).toBe('false')
    })

    it('compares values with a custom comparator', async () => {
      const { wrapper } = await dataGroup({
        multiple: true,
        modelValue: ['A'],
        valueComparator: (left: string, right: string) => left.toLowerCase() === right.toLowerCase(),
      })

      expect(selectedValues(wrapper)).toEqual(['a'])
    })
  })

  describe('bulk actions', () => {
    it('selects, unselects and toggles every enabled item from the group slot', async () => {
      let group: SelectionGroupSlot<string> | undefined
      const { model } = await manualGroup({ multiple: true }, (slot) => {
        group = slot
      })

      group!.selectAll()
      await nextTick()
      expect(model.value).toEqual(['a', 'b', 'c'])

      group!.unselectAll()
      await nextTick()
      expect(model.value).toEqual([])

      group!.toggleAll()
      await nextTick()
      expect(model.value).toEqual(['a', 'b', 'c'])
    })

    it('stops selectAll at the max, in item order', async () => {
      let group: SelectionGroupSlot<string> | undefined
      const { model } = await manualGroup({ multiple: true, max: 2 }, (slot) => {
        group = slot
      })

      group!.selectAll()
      await nextTick()

      expect(model.value).toEqual(['a', 'b'])
    })

    it('fills only the room left under the max', async () => {
      let group: SelectionGroupSlot<string> | undefined
      const { model } = await manualGroup({ multiple: true, max: 2, modelValue: ['c'] }, (slot) => {
        group = slot
      })

      group!.selectAll()
      await nextTick()

      expect([...(model.value as string[])].sort()).toEqual(['a', 'c'])
    })

    it('clears with toggleAll once the max is reached', async () => {
      let group: SelectionGroupSlot<string> | undefined
      const { model } = await manualGroup({ multiple: true, max: 2, modelValue: ['a', 'b'] }, (slot) => {
        group = slot
      })

      group!.toggleAll()
      await nextTick()

      expect(model.value).toEqual([])
    })

    it('selects nothing with selectAll in a disabled group', async () => {
      let group: SelectionGroupSlot<string> | undefined
      const { model } = await manualGroup({ multiple: true, disabled: true }, (slot) => {
        group = slot
      })

      group!.selectAll()
      await nextTick()

      expect(model.value ?? []).toEqual([])
    })

    it('reports all, mixed and none through the group slot', async () => {
      const seen: Array<{ all: boolean, mixed: boolean }> = []
      const { wrapper } = await manualGroup({ multiple: true, modelValue: ['a'] }, slot => seen.push({ all: slot.isAllSelected, mixed: slot.isMixed }))

      expect(seen.at(-1)).toEqual({ all: false, mixed: true })

      await buttonFor(wrapper, 'b').trigger('click')
      await buttonFor(wrapper, 'c').trigger('click')
      await nextTick()

      expect(seen.at(-1)).toEqual({ all: true, mixed: false })
    })
  })

  describe('dynamic items', () => {
    it('drops a removed selected item from the model', async () => {
      const visible = ref(true)
      const model = ref<string[]>(['a', 'b'])
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MSelectionGroup as never, {
          'multiple': true,
          'modelValue': model.value,
          'onUpdate:modelValue': (value: string[]) => { model.value = value },
        }, {
          default: () => ['a', 'b'].filter(value => value === 'a' || visible.value).map(value => h(
            MSelectionItem as never,
            { key: value, value },
            { default: (scope: SelectionItemState<string>) => itemButton(scope) },
          )),
        }),
      }))

      visible.value = false
      await nextTick()
      await nextTick()

      expect(model.value).toEqual(['a'])
      wrapper.unmount()
    })
  })

  describe('server render', () => {
    it.each([
      ['data-driven', { items: [{ id: 'a' }, { id: 'b' }], itemValue: 'id' }, { item: (scope: SelectionItemState<string>) => h('i', { class: scope.isSelected ? 'on' : 'off' }) }],
      ['manual', {}, { default: () => ['a', 'b'].map(value => h(MSelectionItem as never, { key: value, value }, { default: (scope: SelectionItemState<string>) => h('i', { class: scope.isSelected ? 'on' : 'off' }) })) }],
    ])('ships the %s item matching a preset model as selected in the first frame', async (_, props, slots) => {
      const html = await renderToString(createSSRApp({
        render: () => h(MSelectionGroup as never, { modelValue: 'b', ...props }, slots),
      }))

      expect(html.match(/<i class="(on|off)">/g)).toEqual(['<i class="off">', '<i class="on">'])
    })

    it('ships rows taken by the default slot inside its wrapper, and nowhere else', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MSelectionGroup as never, { modelValue: 'b', items: ['a', 'b'], pattern: 'radio' }, {
          default: (scope: SelectionGroupSlot<string>) => h('div', { class: 'wrapper', ...scope.groupAttrs }, [h(scope.rows!)]),
          item: (scope: SelectionItemState<string>) => h('i', { class: scope.isSelected ? 'on' : 'off', ...scope.attrs }),
        }),
      }))

      expect(html).toMatch(/<div class="wrapper" role="radiogroup">.*<i class="off" role="radio" aria-checked="false"><\/i>.*<i class="on" role="radio" aria-checked="true"><\/i>.*<\/div>/)
      expect(html.match(/<i /g)).toHaveLength(2)
    })
  })

  describe('manual items', () => {
    it('registers MSelectionItem children and toggles through their slot', async () => {
      const { wrapper, model } = await manualGroup({ modelValue: 'a' })

      expect(selectedValues(wrapper)).toEqual(['a'])

      await buttonFor(wrapper, 'c').trigger('click')
      await nextTick()

      expect(model.value).toBe('c')
      expect(selectedValues(wrapper)).toEqual(['c'])
    })
  })
})
