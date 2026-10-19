import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Slots } from 'vue'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'
import type { MDatePickerMode, MDatePickerValue } from '#kit/components/ui/date-picker/props'
import MDialogDate from './index.vue'

// The dialog teleports into the shared #ui-overlay-host; real transitions, so
// the overlay's lifecycle settles on their hooks.
const MOUNT_OPTIONS = { global: { stubs: { transition: false } } }
const mounted: Array<{ unmount: () => void }> = []
const settle = () => new Promise(resolve => setTimeout(resolve, 50))

beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
  document.documentElement.style.overflow = ''
  document.body.style.paddingRight = ''
})

interface DialogSetup {
  date?: MDatePickerValue | null
  /** Bind `v-model:mode` from the start. */
  mode?: MDatePickerMode
  props?: Record<string, unknown>
  slots?: Slots
}

async function mountDialog({ date: initial = null, mode: boundMode, props = {}, slots = {} }: DialogSetup = {}) {
  const open = ref(false)
  const date = ref<MDatePickerValue | null>(initial)
  const mode = ref<MDatePickerMode | undefined>(boundMode)
  const events: Array<[string, unknown?]> = []

  const Harness = defineComponent({
    setup: () => () => h(MDialogDate, {
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

describe('m-dialog-date', () => {
  it('confirms the day just chosen, with the date model bound both ways', async () => {
    const view = await mountDialog({ date: new Date(2026, 9, 14) })
    await view.show()

    view.day('Tuesday, October 20, 2026').click()
    await nextTick()
    view.button('OK').click()
    await settle()

    const [name, payload] = view.events.at(-1)!
    expect(name).toBe('confirm')
    expect((payload as Date).getDate()).toBe(20)
    expect((view.date.value as Date).getDate()).toBe(20)
  })

  it('opens a day string on that day and writes a day string back', async () => {
    const view = await mountDialog({ date: '2026-10-14' })
    await view.show()

    expect(view.dialog().querySelector('[aria-selected="true"]')!.getAttribute('aria-label')).toBe('Wednesday, October 14, 2026')
    view.day('Tuesday, October 20, 2026').click()
    await nextTick()
    view.button('OK').click()
    await settle()

    expect(view.date.value).toBe('2026-10-20')
  })

  it('drops the draft on Cancel and says so', async () => {
    const view = await mountDialog({ date: new Date(2026, 9, 14) })
    await view.show()

    view.day('Tuesday, October 20, 2026').click()
    view.button('Cancel').click()
    await settle()

    expect(view.events.at(-1)).toEqual(['cancel'])
    expect((view.date.value as Date).getDate()).toBe(14)
  })

  it('opens in `initialMode` every time, unless `v-model:mode` holds the mode', async () => {
    const free = await mountDialog({ props: { initialMode: 'picker' } })
    await free.show()
    free.dialog().querySelector<HTMLButtonElement>('.ui-date-picker__mode')!.click()
    await settle()
    expect(free.dialog().querySelector('input[inputmode="numeric"]')).not.toBeNull()
    await free.hide()
    await free.show()
    expect(free.dialog().querySelector('[role="grid"]')).not.toBeNull()
    await free.hide()

    const bound = await mountDialog({ mode: 'picker' })
    await bound.show()
    bound.dialog().querySelector<HTMLButtonElement>('.ui-date-picker__mode')!.click()
    await settle()
    expect(bound.mode.value).toBe('input')
    await bound.hide()
    await bound.show()
    expect(bound.dialog().querySelector('input[inputmode="numeric"]')).not.toBeNull()
  })

  it('hands every picker prop and slot to the picker', async () => {
    const view = await mountDialog({
      date: new Date(2026, 9, 14),
      props: { nextMonthLabel: 'Следующий месяц', modeToggle: false },
      slots: { day: ({ day }: { day: { label: string } }) => h('b', { class: 'busy' }, day.label) } as unknown as Slots,
    })
    await view.show()

    expect(view.dialog().querySelector('[aria-label="Следующий месяц"]')).not.toBeNull()
    expect(view.dialog().querySelector('.ui-date-picker__mode')).toBeNull()
    expect(view.dialog().querySelectorAll('.busy')).toHaveLength(31)
  })
})
