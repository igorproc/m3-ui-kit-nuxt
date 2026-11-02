import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MFileInput from '../index.vue'

let current: { unmount: () => void } | null = null

export async function mount(
  props: Record<string, unknown> = {},
  options: { attrs?: Record<string, unknown>, slots?: Record<string, (...args: never[]) => unknown>, attach?: boolean } = {},
) {
  if (current) current.unmount()
  current = await mountSuspended(MFileInput, {
    props,
    attrs: options.attrs,
    slots: options.slots,
    attachTo: options.attach ? document.body : undefined,
  })

  return current as VueWrapper
}

export function unmount() {
  current?.unmount()
  current = null
}

export const field = (wrapper: VueWrapper) => wrapper.find('input.ui-text-field__input')
export const native = (wrapper: VueWrapper) => wrapper.find('input[type="file"]')

/** Puts files on the native input and fires its change, as a pick does. */
export async function pick(wrapper: VueWrapper, files: File[]) {
  const input = native(wrapper)
  Object.defineProperty(input.element, 'files', { configurable: true, value: files })
  await input.trigger('change')
}
