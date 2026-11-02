import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import MRadio from '../index.vue'
import MRadioGroup from '../group/index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

/** Mounts one standalone radio at a time; the previous mount is unmounted first. */
export async function mount(props: Record<string, unknown> = {}, slots?: Slots, attach = false) {
  unmountCurrent()
  current = await mountSuspended(MRadio, {
    props: { value: 'a', ...props },
    slots,
    ...(attach ? { attachTo: document.body } : {}),
  })

  return current as VueWrapper
}

export function unmountCurrent() {
  current?.unmount()
  current = null
}

/**
 * Mounts a group of radios (`values`) bound to a host model; the host keeps the
 * model the group emits, as a `v-model` would.
 */
export async function mountGroup(
  groupProps: Record<string, unknown> = {},
  values: Array<string | Record<string, unknown>> = ['a', 'b', 'c'],
  attach = false,
) {
  unmountCurrent()
  const model: Ref<unknown> = ref(groupProps.modelValue)
  current = await mountSuspended(defineComponent({
    setup: () => () => h(
      MRadioGroup as never,
      { ...groupProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value } },
      () => values.map((entry) => {
        const props = typeof entry === 'string' ? { value: entry, label: entry.toUpperCase() } : entry
        return h(MRadio, { key: String(props.value), ...props } as never)
      }),
    ),
  }), attach ? { attachTo: document.body } : {})

  return { wrapper: current as VueWrapper, model }
}

/** A validation adapter whose one field holds `value` and reports `error`. */
export function stubAdapter(value: unknown = undefined, error?: string) {
  const field = { value: ref(value), errorMessage: ref<string | undefined>(error) }
  const adapter: ValidationAdapter = {
    bindField: () => ({
      ...field,
      meta: { required: false, touched: true, dirty: true, valid: !error, validated: true, pending: false },
    }) as never,
    createForm: () => { throw new Error('unused') },
  }

  return { adapter, value: field.value as Ref<unknown> }
}

/** Mounts `render` under a provided adapter. */
export async function mountWithAdapter(adapter: ValidationAdapter, render: () => unknown) {
  unmountCurrent()
  current = await mountSuspended(defineComponent({
    setup() {
      provideValidationAdapter(adapter)
      return render as () => never
    },
  }))

  return current as VueWrapper
}

export { MRadio, MRadioGroup }
