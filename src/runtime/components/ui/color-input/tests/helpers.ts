import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MColorInput from '../index.vue'

let current: { unmount: () => void } | null = null

/** The picker opens in a panel that teleports into `#ui-overlay-host`. */
export function addOverlayHost() {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
}

export function cleanUp() {
  current?.unmount()
  current = null
  document.getElementById('ui-overlay-host')?.remove()
}

/** Mounts the field under a host that owns `v-model` and `v-model:open`. */
export async function mountInput(inputProps: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const model = ref<string | null>((inputProps.modelValue as string) ?? null)
  const open = ref<boolean>(Boolean(inputProps.open))
  const changes: Array<string | null> = []
  const invalid: string[] = []
  const events: string[] = []
  const Harness = defineComponent({
    setup: () => () => h(MColorInput, {
      'pickerLabel': 'Pick a colour',
      ...inputProps,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: string | null) => { model.value = value },
      'open': open.value,
      'onUpdate:open': (value: boolean) => { open.value = value },
      'onChange': (value: string | null) => { changes.push(value) },
      'onInvalid': (draft: string) => { invalid.push(draft) },
      'onClear': () => { events.push('clear') },
      'onOpen': () => { events.push('open') },
      'onClose': () => { events.push('close') },
    }, slots),
  })

  if (current) current.unmount()
  const wrapper = await mountSuspended(Harness)
  current = wrapper

  return { model, open, changes, invalid, events, wrapper: wrapper as VueWrapper }
}

export const input = (wrapper: VueWrapper) => wrapper.find('.ui-text-field__input')

export async function typeAndEnter(wrapper: VueWrapper, value: string) {
  await input(wrapper).setValue(value)
  await input(wrapper).trigger('keydown', { key: 'Enter' })
}
