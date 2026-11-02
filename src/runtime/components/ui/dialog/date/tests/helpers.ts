import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Slots } from 'vue'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'
import type { MDatePickerMode, MDatePickerValue } from '#kit/components/ui/date-picker/props'
import MDialogDate from '../index.vue'

/** Every phrase of the dialog and its picker, passed the way an app passes them. */
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
  cancelLabel: 'Cancel',
  confirmLabel: 'OK',
} as const

// The dialog teleports into the shared #ui-overlay-host; real transitions, so
// the overlay's lifecycle settles on their hooks.
const MOUNT_OPTIONS = { global: { stubs: { transition: false } } }
const mounted: Array<{ unmount: () => void }> = []

export const settle = () => new Promise(resolve => setTimeout(resolve, 50))

export function addOverlayHost() {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
}

export function cleanUp() {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
  document.documentElement.style.overflow = ''
  document.body.style.paddingRight = ''
}

interface DialogSetup {
  date?: MDatePickerValue | null
  /** Bind `v-model:mode` from the start. */
  mode?: MDatePickerMode
  props?: Record<string, unknown>
  slots?: Slots
}

export async function mountDialog({ date: initial = null, mode: boundMode, props = {}, slots = {} }: DialogSetup = {}) {
  const open = ref(false)
  const date = ref<MDatePickerValue | null>(initial)
  const mode = ref<MDatePickerMode | undefined>(boundMode)
  const events: Array<[string, unknown?]> = []

  const Harness = defineComponent({
    setup: () => () => h(MDialogDate, {
      'modeToggle': true,
      ...LABELS,
      ...props,
      'modelValue': open.value,
      'onUpdate:modelValue': (value: boolean) => {
        open.value = value
      },
      'date': date.value,
      'onUpdate:date': (value: MDatePickerValue | null) => {
        date.value = value
      },
      ...(boundMode
        ? { 'mode': mode.value, 'onUpdate:mode': (value: MDatePickerMode) => {
            mode.value = value
          } }
        : {}),
      'onConfirm': (value: unknown) => events.push(['confirm', value]),
      'onCancel': () => events.push(['cancel']),
    }, slots),
  })

  const wrapper = await mountSuspended(Harness, MOUNT_OPTIONS)
  mounted.push(wrapper)

  const show = async () => {
    open.value = true
    await nextTick()
    await settle()
  }
  const hide = async () => {
    open.value = false
    await nextTick()
    await settle()
  }
  const dialog = () => document.querySelector<HTMLElement>('.ui-date-dialog')!
  const day = (label: string) => dialog().querySelector<HTMLElement>(`[aria-label="${label}"]`)!
  const button = (text: string) => [...dialog().querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === text)!

  return { open, date, mode, events, show, hide, dialog, day, button }
}
