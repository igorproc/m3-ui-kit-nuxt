import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { useOverlayHost } from '../../../ui/overlay/tests/helpers'
import { mountPopover, openPopover, panel, triggerEl } from './helpers'

useOverlayHost()

describe('fragments/popover · a11y', () => {
  // The panel is not a menu: the widget inside keeps its own semantics.
  describe('role', () => {
    it('gives the panel no role of its own', async () => {
      await mountPopover({ modelValue: true })

      expect(panel()!.hasAttribute('role')).toBe(false)
    })

    it('leaves the buttons inside alone', async () => {
      const { open } = await mountPopover({ trapFocus: true })
      await openPopover(open)

      const swatch = panel()!.querySelector('.swatch')!
      expect(swatch.hasAttribute('role')).toBe(false)
      expect(swatch.getAttribute('tabindex')).toBeNull()
    })

    it('leaves a hosted listbox its own role', async () => {
      await mountPopover({ modelValue: true }, () => h('div', { role: 'listbox' }, [h('div', { role: 'option' }, 'One')]))

      expect(panel()!.querySelector('[role="listbox"]')).not.toBeNull()
    })
  })

  describe('focus', () => {
    it('leaves focus on the trigger without trap-focus', async () => {
      const { open } = await mountPopover()
      triggerEl().focus()
      await openPopover(open)

      expect(document.activeElement).toBe(triggerEl())
    })

    it('moves focus onto the panel with trap-focus', async () => {
      const { open } = await mountPopover({ trapFocus: true })
      triggerEl().focus()
      await openPopover(open)

      expect(document.activeElement).toBe(panel())
    })
  })
})
