import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { keydown, settle, useOverlayHost } from '../../../ui/overlay/tests/helpers'
import { mountPopover, openPopover, panel, pointerClick, triggerEl } from './helpers'

useOverlayHost()

describe('fragments/popover · interaction', () => {
  describe('keyboard', () => {
    // A picker in a panel: Tab walks its controls, it does not close the panel.
    it('keeps Tab inside the panel without closing it', async () => {
      const { open } = await mountPopover({ trapFocus: true })
      triggerEl().focus()
      await openPopover(open)
      const hex = panel()!.querySelector<HTMLElement>('.hex')!
      const swatch = panel()!.querySelector<HTMLElement>('.swatch')!

      swatch.focus()
      const event = keydown(swatch, 'Tab')
      await nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(hex)
      expect(open.value).toBe(true)
    })

    it('closes on Escape and gives focus back to the trigger', async () => {
      const { open } = await mountPopover({ trapFocus: true })
      triggerEl().focus()
      await openPopover(open)

      keydown(panel()!.querySelector('.hex')!, 'Escape')
      await settle()

      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(triggerEl())
    })

    it('leaves Escape to the widget without trap-focus', async () => {
      const { open } = await mountPopover({ modelValue: true })

      const event = keydown(panel()!, 'Escape')

      expect(event.defaultPrevented).toBe(false)
      expect(open.value).toBe(true)
    })
  })

  describe('outside', () => {
    it('emits click-outside and closes on a press outside it', async () => {
      const { open, outside } = await mountPopover({ modelValue: true })

      pointerClick(document.querySelector('.after')!)
      await nextTick()

      expect(outside.length).toBeGreaterThan(0)
      expect(open.value).toBe(false)
    })

    it('only reports the press with close-on-outside off', async () => {
      const { open, outside } = await mountPopover({ modelValue: true, closeOnOutside: false })

      pointerClick(document.querySelector('.after')!)
      await nextTick()

      expect(outside.length).toBeGreaterThan(0)
      expect(open.value).toBe(true)
    })

    it('ignores a press on its trigger, so the trigger can toggle it', async () => {
      const { open } = await mountPopover({ modelValue: true })

      pointerClick(triggerEl())
      await nextTick()

      expect(open.value).toBe(false)
    })

    it('leaves focus where an outside press put it', async () => {
      const { open } = await mountPopover({ trapFocus: true })
      await openPopover(open)
      const after = document.querySelector<HTMLElement>('.after')!

      after.focus()
      pointerClick(after)
      await settle()

      expect(document.activeElement).toBe(after)
    })
  })

  describe('scroll lock', () => {
    it.each([
      [true, 'hidden'],
      [false, ''],
    ] as const)('lock-scroll=%s sets the page overflow to %o', async (lockScroll, overflow) => {
      const { open } = await mountPopover({ lockScroll })
      await openPopover(open)

      expect(document.documentElement.style.overflow).toBe(overflow)
    })
  })
})
