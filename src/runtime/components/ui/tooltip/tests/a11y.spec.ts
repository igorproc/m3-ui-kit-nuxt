import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MTooltip from '../index.vue'
import { useOverlayHost } from '../../overlay/tests/helpers'
import { boundTrigger, mountTooltip, surface } from './helpers'

useOverlayHost()

describe('m-tooltip · a11y', () => {
  describe('role', () => {
    it('gives the surface the tooltip role', async () => {
      await mountTooltip()

      expect(surface()!.getAttribute('role')).toBe('tooltip')
    })

    // Without actions a rich tooltip is still a tooltip.
    it('keeps the tooltip role on a rich tooltip', async () => {
      await mountTooltip({ text: 'Swipe to archive.', variant: 'rich', subhead: 'Archive' })

      expect(surface()!.getAttribute('role')).toBe('tooltip')
    })

    it('leaves the trigger slot its own role', async () => {
      const wrapper = await mountTooltip()

      expect(wrapper.find('.target').attributes('role')).toBeUndefined()
    })
  })

  describe('description', () => {
    it('describes the focusable trigger through the slot props, before it is ever shown', async () => {
      const wrapper = await mountTooltip({ text: 'Hint' }, { default: boundTrigger })

      const describedBy = wrapper.find('.target').attributes('aria-describedby')!
      expect(document.getElementById(describedBy)).toBe(surface())
    })

    it('links the first focusable child itself when the slot props are not taken', async () => {
      const wrapper = await mountTooltip({ text: 'Hint' }, { default: () => h('span', { class: 'wrap' }, [h('a', { class: 'target', href: '#' }, 'Docs')]) })

      const describedBy = wrapper.find('.target').attributes('aria-describedby')!
      expect(document.getElementById(describedBy)).toBe(surface())
    })

    it('does not add the id twice when the slot props are taken', async () => {
      const wrapper = await mountTooltip({ text: 'Hint' }, { default: boundTrigger })

      expect(wrapper.find('.target').attributes('aria-describedby')!.split(' ')).toHaveLength(1)
    })

    it('keeps a description the consumer already gave', async () => {
      const wrapper = await mountTooltip({ text: 'Hint' }, { default: () => h('button', { 'class': 'target', 'aria-describedby': 'own-hint' }, 'Trigger') })

      expect(wrapper.find('.target').attributes('aria-describedby')!.split(' ')).toEqual(['own-hint', surface()!.id])
    })

    it.each([
      ['bound', boundTrigger],
      ['not bound', () => h('button', { class: 'target' }, 'Trigger')],
    ] as const)('describes nothing without text (slot props %s)', async (_, trigger) => {
      const wrapper = await mountTooltip({ text: '' }, { default: trigger })

      expect(wrapper.find('.target').attributes('aria-describedby')).toBeUndefined()
    })

    it('names no id in the server HTML: the surface does not exist there yet', async () => {
      const app = createSSRApp(defineComponent({ render: () => h(MTooltip, { text: 'Hint' }, { default: boundTrigger }) }))

      const html = await renderToString(app)

      expect(html).toContain('class="target"')
      expect(html).not.toContain('aria-describedby')
    })

    it('puts no description on the wrapping span', async () => {
      const wrapper = await mountTooltip()

      expect(wrapper.find('.ui-tooltip__trigger').attributes('aria-describedby')).toBeUndefined()
    })
  })
})
