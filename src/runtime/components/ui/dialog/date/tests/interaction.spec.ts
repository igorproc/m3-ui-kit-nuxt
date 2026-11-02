import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { addOverlayHost, cleanUp, mountDialog, settle } from './helpers'

beforeEach(addOverlayHost)
afterEach(cleanUp)

describe('m-dialog-date · interaction', () => {
  describe('confirm and cancel', () => {
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
      expect(view.open.value).toBe(false)
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

    // N.7 (Q51-Б): a form field bound to `null` asks for a day string.
    it('confirms into an empty model in the type valueType asks', async () => {
      vi.setSystemTime(new Date(2026, 9, 14))
      const view = await mountDialog({ props: { valueType: 'string' } })
      await view.show()
      vi.useRealTimers()

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

    it('reads any close that is not OK as a cancel', async () => {
      const view = await mountDialog({ date: new Date(2026, 9, 14) })
      await view.show()

      view.day('Tuesday, October 20, 2026').click()
      await view.hide()

      expect(view.events.at(-1)).toEqual(['cancel'])
      expect((view.date.value as Date).getDate()).toBe(14)
    })

    it('starts every opening from the model, not from the last draft', async () => {
      const view = await mountDialog({ date: new Date(2026, 9, 14) })
      await view.show()
      view.day('Tuesday, October 20, 2026').click()
      await nextTick()
      await view.hide()

      await view.show()

      expect(view.dialog().querySelector('[aria-selected="true"]')!.getAttribute('aria-label')).toBe('Wednesday, October 14, 2026')
    })

    it('keeps a refused typed date open, with its error', async () => {
      const view = await mountDialog({ props: { initialMode: 'input' } })
      await view.show()
      const field = view.dialog().querySelector<HTMLInputElement>('input[inputmode="numeric"]')!

      field.value = 'nonsense'
      field.dispatchEvent(new Event('input'))
      await nextTick()
      view.button('OK').click()
      await settle()

      expect(view.open.value).toBe(true)
      expect(view.events.some(([name]) => name === 'confirm')).toBe(false)
      expect(view.dialog().querySelector('[role="alert"]')!.textContent).toContain('Date does not match')
    })
  })

  describe('mode', () => {
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
  })
})
