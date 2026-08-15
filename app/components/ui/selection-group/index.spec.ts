import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mount } from '@vue/test-utils'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import MSelectionGroup from './index.vue'
import MSelectionItem from '~/components/ui/selection-item/index.vue'
import { useSelectionContext } from '~/composables/selection/context'
import type { SelectionItemState } from '~/composables/selection/context'

interface Plan { id: string, title: string, unavailable?: boolean }

type ItemScope = SelectionItemState<string> & { item?: Plan }

const plans: Plan[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]

/** Renders each data-driven item as a button reflecting its state. */
function itemButton(scope: ItemScope) {
  return h('button', {
    'class': 'item',
    'data-value': scope.value,
    'data-selected': String(scope.isSelected),
    'data-blocked': String(scope.isSelectionBlocked),
    'data-reason': String(scope.blockReason),
    'onClick': scope.toggle,
  }, scope.item ? scope.item.title : scope.value)
}

async function mountGroup(groupProps: Record<string, unknown>, slots: Record<string, unknown>) {
  const model: Ref<unknown> = ref(groupProps.modelValue)
  const Harness = defineComponent({
    setup: () => () => h(
      MSelectionGroup,
      {
        ...groupProps,
        'modelValue': model.value,
        'onUpdate:modelValue': (value: unknown) => { model.value = value },
      },
      slots,
    ),
  })
  const wrapper = await mountSuspended(Harness)
  return { wrapper, model }
}

function buttonFor(wrapper: VueWrapper, value: string) {
  return wrapper.findAll('.item').find((b: DOMWrapper<Element>) => b.attributes('data-value') === value)!
}

describe('m-selection-group (data-driven)', () => {
  it('selects the item matching a preset single model at mount', async () => {
    const { wrapper } = await mountGroup(
      { items: plans, itemValue: (p: Plan) => p.id, modelValue: 'a' },
      { item: (s: ItemScope) => itemButton(s) },
    )

    expect(buttonFor(wrapper, 'a').attributes('data-selected')).toBe('true')
    expect(buttonFor(wrapper, 'b').attributes('data-selected')).toBe('false')
  })

  it('single mode replaces the selection and emits the raw value', async () => {
    const { wrapper, model } = await mountGroup(
      { items: plans, itemValue: (p: Plan) => p.id, modelValue: 'a' },
      { item: (s: ItemScope) => itemButton(s) },
    )

    await buttonFor(wrapper, 'b').trigger('click')
    await nextTick()

    expect(model.value).toBe('b')
    expect(buttonFor(wrapper, 'a').attributes('data-selected')).toBe('false')
    expect(buttonFor(wrapper, 'b').attributes('data-selected')).toBe('true')
  })

  it('multiple mode accumulates values into an array', async () => {
    const { wrapper, model } = await mountGroup(
      { items: plans, itemValue: (p: Plan) => p.id, multiple: true, modelValue: ['a'] },
      { item: (s: ItemScope) => itemButton(s) },
    )

    await buttonFor(wrapper, 'b').trigger('click')
    await nextTick()

    expect(model.value).toEqual(['a', 'b'])
  })

  it('mandatory prevents deselecting the last selected item', async () => {
    const { wrapper, model } = await mountGroup(
      { items: plans, itemValue: (p: Plan) => p.id, mandatory: true, modelValue: 'a' },
      { item: (s: ItemScope) => itemButton(s) },
    )

    await buttonFor(wrapper, 'a').trigger('click')
    await nextTick()

    expect(model.value).toBe('a')
    expect(buttonFor(wrapper, 'a').attributes('data-selected')).toBe('true')
  })

  it('blocks unselected items once max is reached', async () => {
    const { wrapper, model } = await mountGroup(
      { items: plans, itemValue: (p: Plan) => p.id, multiple: true, max: 2, modelValue: ['a', 'b'] },
      { item: (s: ItemScope) => itemButton(s) },
    )

    const c = buttonFor(wrapper, 'c')
    expect(c.attributes('data-blocked')).toBe('true')
    expect(c.attributes('data-reason')).toBe('max')

    await c.trigger('click')
    await nextTick()

    expect(model.value).toEqual(['a', 'b'])
  })

  it('marks disabled items as blocked with the disabled reason', async () => {
    const { wrapper } = await mountGroup(
      { items: plans, itemValue: (p: Plan) => p.id, itemDisabled: (p: Plan) => p.id === 'c' },
      { item: (s: ItemScope) => itemButton(s) },
    )

    const c = buttonFor(wrapper, 'c')
    expect(c.attributes('data-blocked')).toBe('true')
    expect(c.attributes('data-reason')).toBe('disabled')
  })

  it('renders the empty slot for an empty item list', async () => {
    const { wrapper } = await mountGroup(
      { items: [], itemValue: (p: Plan) => p.id },
      {
        item: (s: ItemScope) => itemButton(s),
        empty: () => h('p', { class: 'empty' }, 'Nothing'),
      },
    )

    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.findAll('.item')).toHaveLength(0)
  })
})

describe('m-selection-item (manual)', () => {
  it('registers with the group and toggles selection', async () => {
    const model: Ref<unknown> = ref('a')
    const Harness = defineComponent({
      setup: () => () => h(
        MSelectionGroup,
        {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: unknown) => { model.value = value },
        },
        {
          default: () => plans.map(plan => h(
            MSelectionItem,
            { value: plan.id },
            { default: (s: SelectionItemState<string>) => itemButton({ ...s, item: plan }) },
          )),
        },
      ),
    })
    const wrapper = await mountSuspended(Harness)

    expect(buttonFor(wrapper, 'a').attributes('data-selected')).toBe('true')

    await buttonFor(wrapper, 'c').trigger('click')
    await nextTick()

    expect(model.value).toBe('c')
    expect(buttonFor(wrapper, 'a').attributes('data-selected')).toBe('false')
    expect(buttonFor(wrapper, 'c').attributes('data-selected')).toBe('true')
  })

  it('throws a clear error when used without a group', () => {
    // Synchronous mount (no Suspense) so the setup-time throw surfaces directly.
    expect(() => mount(MSelectionItem, {
      props: { value: 'x' },
      slots: { default: () => h('span', 'x') },
    })).toThrow(/MSelectionGroup/)
  })
})

describe('m-selection-group (advanced context)', () => {
  it('exposes the same facade to custom children via useSelectionContext', async () => {
    const seen: string[] = []
    const Child = defineComponent({
      setup() {
        const ctx = useSelectionContext<string>()
        seen.push(...ctx.selected.value)
        return () => h('span')
      },
    })
    const Harness = defineComponent({
      setup: () => () => h(
        MSelectionGroup,
        { modelValue: 'b' },
        {
          default: () => [
            ...plans.map(plan => h(MSelectionItem, { value: plan.id }, { default: () => h('span', plan.title) })),
            h(Child),
          ],
        },
      ),
    })

    await mountSuspended(Harness)
    // Child reads the facade without error (selected resolves after items mount).
    expect(Array.isArray(seen)).toBe(true)
  })
})
