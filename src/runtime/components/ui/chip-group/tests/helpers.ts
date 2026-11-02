import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import MChip from '#kit/components/ui/chip/index.vue'
import MChipGroup from '../index.vue'

let current: { unmount: () => void } | null = null

export function unmountCurrent() {
  current?.unmount()
  current = null
}

/**
 * Mounts a group of filter chips (one per `chips` entry, labelled by its value)
 * bound to a host model that keeps whatever the group emits, as `v-model` would.
 */
export async function mountGroup(
  groupProps: Record<string, unknown> = {},
  chips: Array<Record<string, unknown>> = [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
  attach = false,
) {
  unmountCurrent()
  const model: Ref<unknown> = ref(groupProps.modelValue)
  current = await mountSuspended(defineComponent({
    setup: () => () => h(
      MChipGroup as never,
      { ...groupProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value } },
      { default: () => chips.map(chip => h(MChip, { type: 'filter', ...chip }, () => String(chip.value ?? 'chip'))) },
    ),
  }), attach ? { attachTo: document.body } : {})
  await nextTick()

  return { wrapper: current as VueWrapper, model }
}

/** Mounts any host render function; used for data-driven and dynamic cases. */
export async function mountHost(component: ReturnType<typeof defineComponent>, attach = false) {
  unmountCurrent()
  current = await mountSuspended(component, attach ? { attachTo: document.body } : {})
  await nextTick()

  return current as VueWrapper
}

export const buttons = (wrapper: VueWrapper) => wrapper.findAll('button')

export const pressed = (wrapper: VueWrapper) => buttons(wrapper).map(chip => chip.attributes('aria-pressed'))

export { MChip, MChipGroup }
