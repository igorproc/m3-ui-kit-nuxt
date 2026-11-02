import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MTimePicker from '../index.vue'

/** Every phrase of the picker, passed the way an app passes them. */
export const LABELS = {
  ariaLabel: 'Select time',
  hourLabel: 'Hour',
  minuteLabel: 'Minute',
  periodLabel: 'Select AM or PM',
  hourError: 'Enter a valid hour',
  minuteError: 'Enter a valid minute',
} as const

let current: { unmount: () => void } | null = null

export async function mountPicker(
  props: Record<string, unknown> = {},
  options: { slots?: Record<string, (...args: never[]) => unknown>, attach?: boolean } = {},
) {
  if (current) current.unmount()
  current = await mountSuspended(MTimePicker, {
    props: { ...LABELS, ...props },
    slots: options.slots,
    attachTo: options.attach ? document.body : undefined,
  })

  return current as VueWrapper
}

export function unmountPicker() {
  current?.unmount()
  current = null
}
