import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MColorPicker from '../index.vue'
import type { ColorFormat } from '#kit/shared/utils/color'

let current: { unmount: () => void } | null = null

/**
 * Mounts the picker under a host that owns `v-model` and `v-model:format`,
 * so a write from the picker is read back as a parent would.
 */
export async function mountPicker(pickerProps: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const model = ref<string | null>((pickerProps.modelValue as string) ?? null)
  const format = ref<ColorFormat>((pickerProps.format as ColorFormat) ?? 'hex')
  const changes: Array<string | null> = []
  const invalid: Array<[string, string]> = []
  const Harness = defineComponent({
    setup: () => () => h(MColorPicker, {
      ...pickerProps,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: string | null) => { model.value = value },
      'format': format.value,
      'onUpdate:format': (value: ColorFormat) => { format.value = value },
      'onChange': (value: string | null) => { changes.push(value) },
      'onInvalid': (draft: string, reason: string) => { invalid.push([draft, reason]) },
    }, slots),
  })

  if (current) current.unmount()
  const wrapper = await mountSuspended(Harness)
  current = wrapper

  return { model, format, changes, invalid, wrapper: wrapper as VueWrapper }
}

export function unmountPicker() {
  current?.unmount()
  current = null
}
