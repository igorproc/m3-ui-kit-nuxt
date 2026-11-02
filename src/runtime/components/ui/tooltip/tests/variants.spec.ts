import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { useOverlayHost } from '../../overlay/tests/helpers'
import { isShown, mountTooltip, surface } from './helpers'

useOverlayHost()

describe('m-tooltip · variants', () => {
  describe('anatomy', () => {
    it('wraps the trigger slot in the anchor span', async () => {
      const wrapper = await mountTooltip()

      expect(wrapper.classes()).toContain('ui-tooltip')
      expect(wrapper.find('.ui-tooltip__trigger .target').exists()).toBe(true)
    })

    // The description has to exist before focus lands, or a screen reader
    // reads the trigger without it.
    it('keeps the surface in the document, hidden, until it is shown', async () => {
      await mountTooltip()

      expect(surface()).not.toBeNull()
      expect(isShown()).toBe(false)
    })
  })

  describe('variant', () => {
    it.each(['plain', 'rich'] as const)('draws the %s surface', async (variant) => {
      const wrapper = await mountTooltip({ text: 'Hint', variant })
      await wrapper.trigger('mouseenter')

      expect(surface()!.classList).toContain(`ui-tooltip__content--${variant}`)
    })

    it('defaults to plain', async () => {
      await mountTooltip()

      expect(surface()!.classList).toContain('ui-tooltip__content--plain')
    })

    it('renders a subhead above the text of a rich tooltip', async () => {
      await mountTooltip({ text: 'Swipe a message to archive it.', variant: 'rich', subhead: 'Archive' })

      expect(surface()!.querySelector('.ui-tooltip__subhead')!.textContent?.trim()).toBe('Archive')
      expect(surface()!.querySelector('.ui-tooltip__subhead + .ui-tooltip__text')).not.toBeNull()
    })

    it('renders no subhead on a plain tooltip', async () => {
      await mountTooltip({ text: 'Hint', subhead: 'Archive' })

      expect(surface()!.querySelector('.ui-tooltip__subhead')).toBeNull()
    })

    it('prefers the subhead slot over the prop', async () => {
      await mountTooltip({ text: 'Text', variant: 'rich', subhead: 'Prop' }, { subhead: () => 'Slot' })

      expect(surface()!.querySelector('.ui-tooltip__subhead')!.textContent?.trim()).toBe('Slot')
    })
  })

  describe('content', () => {
    it('renders the text prop in the surface', async () => {
      const wrapper = await mountTooltip()
      await wrapper.trigger('mouseenter')

      expect(surface()!.textContent?.trim()).toBe('Hint')
    })

    it('prefers the content slot over the text prop', async () => {
      const wrapper = await mountTooltip({ text: 'Hint' }, { content: () => h('strong', { class: 'rich' }, 'Custom') })
      await wrapper.trigger('mouseenter')

      expect(surface()!.querySelector('.rich')!.textContent).toBe('Custom')
      expect(surface()!.textContent).not.toContain('Hint')
    })
  })
})
