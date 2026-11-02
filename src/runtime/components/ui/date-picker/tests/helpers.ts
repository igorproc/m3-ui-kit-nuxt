import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MDatePicker from '../index.vue'

/** Every phrase of the picker, passed the way an app passes them. */
export const LABELS = {
  label: 'Select date',
  inputTitle: 'Enter date',
  prevMonthLabel: 'Previous month',
  nextMonthLabel: 'Next month',
  switchToYearLabel: 'Switch to selecting a year',
  switchToDayLabel: 'Switch to selecting a day',
  switchToInputLabel: 'Switch to text input mode',
  switchToCalendarLabel: 'Switch to calendar input mode',
  inputLabel: 'Date',
  errorPattern: 'Date does not match the expected pattern',
  errorRange: 'Date out of the expected range',
  patternLetters: { day: 'DD', month: 'MM', year: 'YYYY' },
} as const

/** 14 October 2026, a Wednesday. */
export const OCT_14 = () => new Date(2026, 9, 14)

let current: { unmount: () => void } | null = null

export async function mountPicker(
  props: Record<string, unknown> = {},
  options: { slots?: Record<string, (...args: never[]) => unknown>, attach?: boolean } = {},
) {
  if (current) current.unmount()
  current = await mountSuspended(MDatePicker, {
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

export const cell = (wrapper: Pick<VueWrapper, 'findAll'>, label: string) =>
  wrapper.findAll('[role="gridcell"]').find(item => item.attributes('aria-label') === label)!
