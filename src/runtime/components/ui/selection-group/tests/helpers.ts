import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import MSelectionGroup from '../index.vue'
import MSelectionItem from '#kit/components/ui/selection-item/index.vue'
import type { SelectionGroupSlot, SelectionItemState } from '#kit/composables/selection/context'

export interface Plan { id: string, title: string, off?: boolean }

export type ItemScope = SelectionItemState<string> & { item?: Plan, index?: number }

export const plans: Plan[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]

let current: { unmount: () => void } | null = null

export function unmountCurrent() {
  current?.unmount()
  current = null
}

/**
 * Renders an item as a test button. The `data-*` attributes are the harness's
 * own probe markup, not anything the headless group produces.
 */
export function itemButton(scope: ItemScope) {
  return h('button', {
    'class': 'item',
    'data-value': scope.value,
    'data-selected': String(scope.isSelected),
    'data-blocked': String(scope.isSelectionBlocked),
    'data-reason': String(scope.blockReason),
    'onClick': scope.toggle,
  }, scope.item ? scope.item.title : scope.value)
}

/** Mounts a group bound to a host model that keeps whatever the group emits. */
export async function mountGroup(groupProps: Record<string, unknown>, slots: Record<string, unknown>) {
  unmountCurrent()
  const model: Ref<unknown> = ref(groupProps.modelValue)
  current = await mountSuspended(defineComponent({
    setup: () => () => h(
      MSelectionGroup as never,
      { ...groupProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value } },
      slots,
    ),
  }))

  return { wrapper: current as VueWrapper, model }
}

/** A data-driven group over `plans`, each item rendered by {@link itemButton}. */
export const dataGroup = (props: Record<string, unknown> = {}, extraSlots: Record<string, unknown> = {}) =>
  mountGroup({ items: plans, itemValue: (plan: Plan) => plan.id, ...props }, { item: (scope: ItemScope) => itemButton(scope), ...extraSlots })

/** A manual group: one `MSelectionItem` per plan, plus a probe of the group slot. */
export function manualGroup(props: Record<string, unknown> = {}, probe?: (slot: SelectionGroupSlot<string>) => void) {
  return mountGroup(props, {
    default: (slot: SelectionGroupSlot<string>) => {
      probe?.(slot)
      return plans.map(plan => h(
        MSelectionItem as never,
        { value: plan.id, disabled: plan.off },
        { default: (scope: SelectionItemState<string>) => itemButton({ ...scope, item: plan }) },
      ))
    },
  })
}

export function buttonFor(wrapper: VueWrapper, value: string) {
  return wrapper.findAll('.item').find((button: DOMWrapper<Element>) => button.attributes('data-value') === value)!
}

export const selectedValues = (wrapper: VueWrapper) =>
  wrapper.findAll('.item').filter(button => button.attributes('data-selected') === 'true').map(button => button.attributes('data-value'))

export { MSelectionGroup, MSelectionItem }
