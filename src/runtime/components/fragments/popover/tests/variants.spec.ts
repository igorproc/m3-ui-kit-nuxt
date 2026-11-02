import { describe, expect, it } from 'vitest'
import { overlayHost, useOverlayHost } from '../../../ui/overlay/tests/helpers'
import { mountPopover, panel, wrapperEl } from './helpers'

useOverlayHost()

describe('fragments/popover · variants', () => {
  describe('open state', () => {
    it('renders nothing while closed', async () => {
      await mountPopover()

      expect(panel()).toBeNull()
    })

    it('renders its content into the overlay host when open', async () => {
      await mountPopover({ modelValue: true })

      expect(overlayHost().contains(panel())).toBe(true)
      expect(panel()!.querySelector('.hex')).not.toBeNull()
    })
  })

  describe('placement', () => {
    it.each([
      ['bottom-start', 'top left'],
      ['bottom-end', 'top right'],
      ['top', 'bottom center'],
    ] as const)('grows a %s panel out of its %s corner', async (placement, origin) => {
      await mountPopover({ modelValue: true, placement })

      expect(wrapperEl()!.style.getPropertyValue('--ui-menu-origin')).toBe(origin)
    })
  })

  describe('attrs', () => {
    it('keeps class on the wrapper and sends role and aria to the panel', async () => {
      await mountPopover({ 'modelValue': true, 'class': 'colour-panel', 'role': 'dialog', 'aria-label': 'Colour' })

      expect(wrapperEl()!.classList).toContain('colour-panel')
      expect(panel()!.getAttribute('role')).toBe('dialog')
      expect(panel()!.getAttribute('aria-label')).toBe('Colour')
    })
  })
})
