import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MFileUpload from '../index.vue'

export const file = (name: string, type = 'text/plain') => new File(['data'], name, { type, lastModified: 1 })

/** Lets a settled upload promise reach the queue and the queue reach the DOM. */
export async function flush() {
  await Promise.resolve()
  await nextTick()
}

export const messages = {
  queue: 'Upload queue',
  choose: 'Choose files',
  status: { queued: 'Queued', uploading: 'Uploading', success: 'Uploaded', error: 'Failed', cancelled: 'Cancelled' },
  reject: { type: 'type not allowed', size: 'too large', count: 'too many files' },
  start: 'Start {name}',
  cancel: 'Cancel {name}',
  retry: 'Retry {name}',
  remove: 'Remove {name}',
}

/** An upload that never settles: the row stays uploading. */
export const pending = () => new Promise<void>(() => {})

let current: { unmount: () => void } | null = null

export async function mount(
  props: Record<string, unknown> = {},
  options: { slots?: Record<string, (...args: never[]) => unknown>, attach?: boolean } = {},
) {
  if (current) current.unmount()
  current = await mountSuspended(MFileUpload, {
    props,
    slots: options.slots,
    attachTo: options.attach ? document.body : undefined,
  })

  return current as VueWrapper
}

export function unmount() {
  current?.unmount()
  current = null
}

export async function pick(wrapper: VueWrapper, files: File[]) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: files })
  await input.trigger('change')
}
