import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import type { Slots } from 'vue'
import { mDialogDateProps } from '../props'
import { addOverlayHost, cleanUp, mountDialog } from './helpers'

beforeEach(addOverlayHost)
afterEach(cleanUp)

describe('m-dialog-date · variants', () => {
  describe('anatomy', () => {
    it('renders nothing until it opens', async () => {
      await mountDialog()

      expect(document.querySelector('.ui-date-dialog')).toBeNull()
    })

    it('hosts the picker without its own surface, with Cancel and OK under it', async () => {
      const view = await mountDialog({ date: new Date(2026, 9, 14) })
      await view.show()

      expect(view.dialog().querySelector('.ui-date-picker')!.classList).toContain('ui-date-picker--hosted')
      expect([...view.dialog().querySelectorAll('.ui-date-picker__actions button')].map(item => item.textContent?.trim())).toEqual(['Cancel', 'OK'])
    })

    // Q32-А: the kit ships no English copy for its actions either.
    it('ships no words of its own for the actions', async () => {
      const view = await mountDialog({ props: { cancelLabel: undefined, confirmLabel: undefined } })
      await view.show()

      expect([...view.dialog().querySelectorAll('.ui-date-picker__actions button')].map(item => item.textContent?.trim())).toEqual(['', ''])
    })

    it('takes the action labels from the app', async () => {
      const view = await mountDialog({ props: { cancelLabel: 'Отмена', confirmLabel: 'Готово' } })
      await view.show()

      expect(view.button('Отмена')).toBeTruthy()
      expect(view.button('Готово')).toBeTruthy()
    })

    it('leaves the form-control props of the picker out', () => {
      for (const key of ['helperText', 'error', 'errorMessage', 'required', 'name']) {
        expect(Object.keys(mDialogDateProps)).not.toContain(key)
      }
    })
  })

  describe('mode', () => {
    it.each([
      ['picker', '[role="grid"]'],
      ['input', 'input[inputmode="numeric"]'],
    ] as const)('opens in the %s mode of initialMode', async (initialMode, selector) => {
      const view = await mountDialog({ props: { initialMode } })
      await view.show()

      expect(view.dialog().querySelector(selector)).not.toBeNull()
    })
  })

  describe('picker props and slots', () => {
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

    it('hands the label and headline slots to the picker', async () => {
      const view = await mountDialog({
        date: new Date(2026, 9, 14),
        slots: {
          label: () => 'Delivery',
          headline: ({ date }: { date: Date | null }) => `day ${date?.getDate()}`,
        } as unknown as Slots,
      })
      await view.show()

      expect(view.dialog().querySelector('.ui-date-picker__title')!.textContent?.trim()).toBe('Delivery')
      expect(view.dialog().querySelector('.ui-date-picker__headline')!.textContent?.trim()).toBe('day 14')
    })

    it('hands min and max to the picker', async () => {
      const view = await mountDialog({ date: new Date(2026, 9, 14), props: { minDate: new Date(2026, 9, 10) } })
      await view.show()

      expect(view.day('Friday, October 9, 2026').getAttribute('aria-disabled')).toBe('true')
    })
  })
})
