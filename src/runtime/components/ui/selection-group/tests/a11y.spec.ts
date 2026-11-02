import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useSelectionContext } from '#kit/composables/selection/context'
import type { ItemScope } from './helpers'
import { MSelectionGroup, MSelectionItem, buttonFor, dataGroup, itemButton, mountGroup, plans, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-selection-group · a11y', () => {
  describe('state for the consumer’s markup', () => {
    it('hands every item the state it needs for aria-pressed / -selected / -checked', async () => {
      const { wrapper } = await dataGroup({ modelValue: 'b' })

      expect(buttonFor(wrapper, 'b').attributes('data-selected')).toBe('true')
      expect(buttonFor(wrapper, 'a').attributes('data-selected')).toBe('false')
    })

    it('tells a disabled item from one blocked by the max, so each gets its own wording', async () => {
      const items = plans.map(plan => ({ ...plan, off: plan.id === 'c' }))
      const { wrapper } = await dataGroup({ items, itemDisabled: 'off', multiple: true, max: 1, modelValue: ['a'] })

      expect(buttonFor(wrapper, 'b').attributes('data-reason')).toBe('max')
      expect(buttonFor(wrapper, 'c').attributes('data-reason')).toBe('disabled')
    })

    it('marks every item disabled when the group is', async () => {
      const { wrapper } = await dataGroup({ disabled: true })

      expect(wrapper.findAll('.item').every(item => item.attributes('data-reason') === 'disabled')).toBe(true)
    })
  })

  describe('pattern (W27-Б)', () => {
    async function withPattern(pattern: string | undefined, props: Record<string, unknown> = {}) {
      let group: Record<string, unknown> = {}
      const items: Array<Record<string, unknown>> = []
      const { wrapper } = await mountGroup({ items: plans, itemValue: 'id', pattern, ...props }, {
        default: (slot: { groupAttrs: Record<string, unknown> }) => {
          group = slot.groupAttrs
          return null
        },
        item: (scope: ItemScope & { attrs: Record<string, unknown> }) => {
          items[scope.index!] = scope.attrs
          return itemButton(scope)
        },
      })
      return { wrapper, group: () => group, items }
    }

    it('hands out nothing without a pattern, as before', async () => {
      const { group, items } = await withPattern(undefined, { modelValue: 'a' })

      expect(group()).toEqual({})
      expect(items[0]).toEqual({})
    })

    it.each([
      ['toggle', 'group', { 'aria-pressed': 'true' }],
      ['radio', 'radiogroup', { 'role': 'radio', 'aria-checked': 'true' }],
      ['checkbox', 'group', { 'role': 'checkbox', 'aria-checked': 'true' }],
      ['option', 'listbox', { 'role': 'option', 'aria-selected': 'true' }],
    ])('pattern="%s": the wrapper is a %s and a selected item says so', async (pattern, role, selected) => {
      const { group, items } = await withPattern(pattern, { modelValue: 'a' })

      expect(group().role).toBe(role)
      expect(items[0]).toEqual(expect.objectContaining(selected))
      expect(Object.values(items[1]!)).toContain('false')
    })

    it('marks the wrapper of a disabled group unavailable, and only then', async () => {
      const { group } = await withPattern('radio', { disabled: true })
      expect(group()['aria-disabled']).toBe('true')

      const { group: enabled } = await withPattern('radio')
      expect(enabled()['aria-disabled']).toBeUndefined()
    })

    it('marks a multiple listbox multiselectable', async () => {
      const { group } = await withPattern('option', { multiple: true })

      expect(group()['aria-multiselectable']).toBe('true')
    })

    it('reads a disabled item and one blocked by max as unavailable', async () => {
      const items = plans.map(plan => ({ ...plan, off: plan.id === 'c' }))
      const { items: attrs } = await withPattern('checkbox', { items, itemDisabled: 'off', multiple: true, max: 1, modelValue: ['a'] })

      expect(attrs[0]!['aria-disabled']).toBeUndefined()
      expect(attrs[1]!['aria-disabled']).toBe('true')
      expect(attrs[2]!['aria-disabled']).toBe('true')
    })
  })

  describe('context', () => {
    it('exposes the same facade to custom children through useSelectionContext', async () => {
      let selected: unknown
      const Child = defineComponent({
        setup() {
          const context = useSelectionContext<string>()
          return () => {
            selected = context.selected.value
            return h('span')
          }
        },
      })
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MSelectionGroup as never, { modelValue: 'b' }, {
          default: () => [...plans.map(plan => h(MSelectionItem, { value: plan.id }, { default: () => h('span', plan.title) })), h(Child)],
        }),
      }))

      expect(selected).toEqual(['b'])
      wrapper.unmount()
    })

    it('throws a clear error for an item used without a group', () => {
      // Synchronous mount (no Suspense) so the setup-time throw surfaces directly.
      expect(() => mount(MSelectionItem, {
        props: { value: 'x' },
        slots: { default: () => h('span', 'x') },
      })).toThrow(/MSelectionGroup/)
    })
  })
})
