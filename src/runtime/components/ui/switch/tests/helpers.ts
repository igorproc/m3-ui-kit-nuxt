import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import MSwitch from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

/** Mounts one switch at a time; the previous one is unmounted first. */
export async function mount(props: Record<string, unknown> = {}, slots?: Slots, attach = false) {
  unmountCurrent()
  current = await mountSuspended(MSwitch, { props, slots, ...(attach ? { attachTo: document.body } : {}) })

  return current as VueWrapper
}

export function unmountCurrent() {
  current?.unmount()
  current = null
}

/** A validation adapter whose one field holds `value` and reports `error`. */
export function stubAdapter(value: unknown = false, error?: string) {
  const field = { value: ref(value), errorMessage: ref<string | undefined>(error) }
  const adapter: ValidationAdapter = {
    bindField: () => ({
      ...field,
      meta: { required: false, touched: true, dirty: true, valid: !error, validated: true, pending: false },
    }) as never,
    createForm: () => { throw new Error('unused') },
  }

  return { adapter, value: field.value as Ref<unknown>, error: field.errorMessage }
}

/** Mounts a switch under a provided adapter; returns the host wrapper. */
export async function mountWithAdapter(adapter: ValidationAdapter, props: Record<string, unknown> = {}) {
  unmountCurrent()
  current = await mountSuspended(defineComponent({
    setup() {
      provideValidationAdapter(adapter)
      return () => h(MSwitch, { path: 'wifi', ...props })
    },
  }))

  return current as VueWrapper
}
