import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import MTooltip from '../index.vue'
import { keydown, mountTracked, overlayHost, settle, useOverlayHost } from '../../overlay/tests/helpers'
import { isShown, mountTooltip, surface, waitForHideDelay } from './helpers'

useOverlayHost()

afterEach(() => {
  vi.restoreAllMocks()
})

/** happy-dom has no input modality: say whether the focused element matches `:focus-visible`. */
function focusVisible(visible: boolean) {
  const matches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    return selector === ':focus-visible' ? visible : matches.call(this, selector)
  })
}

describe('m-tooltip · interaction', () => {
  describe('pointer', () => {
    it('shows on mouseenter and hides after the grace period on mouseleave', async () => {
      const wrapper = await mountTooltip()

      await wrapper.trigger('mouseenter')
      expect(isShown()).toBe(true)

      await wrapper.trigger('mouseleave')
      // Hoverable (WCAG 1.4.13): a short grace period to reach the tooltip.
      expect(isShown()).toBe(true)
      await waitForHideDelay()
      await settle()
      expect(isShown()).toBe(false)
    })

    it('stays open while the pointer is over the tooltip itself', async () => {
      const wrapper = await mountTooltip()

      await wrapper.trigger('mouseenter')
      await wrapper.trigger('mouseleave')
      surface()!.dispatchEvent(new MouseEvent('mouseenter'))
      await waitForHideDelay()

      expect(isShown()).toBe(true)
    })

    it('hides after leaving the tooltip surface', async () => {
      const wrapper = await mountTooltip()

      await wrapper.trigger('mouseenter')
      surface()!.dispatchEvent(new MouseEvent('mouseenter'))
      surface()!.dispatchEvent(new MouseEvent('mouseleave'))
      await waitForHideDelay()
      await settle()

      expect(isShown()).toBe(false)
    })

    it('cancels a pending hide when the pointer comes back to the trigger', async () => {
      const wrapper = await mountTooltip()

      await wrapper.trigger('mouseenter')
      await wrapper.trigger('mouseleave')
      await wrapper.trigger('mouseenter')
      await waitForHideDelay()

      expect(isShown()).toBe(true)
    })
  })

  describe('focus', () => {
    it('shows on keyboard focus', async () => {
      const wrapper = await mountTooltip()
      focusVisible(true)

      await wrapper.find('.target').trigger('focusin')

      expect(isShown()).toBe(true)
    })

    // A click focuses the button too; the tooltip would then outstay the pointer.
    it('stays hidden on a pointer focus', async () => {
      const wrapper = await mountTooltip()
      focusVisible(false)

      await wrapper.find('.target').trigger('focusin')

      expect(isShown()).toBe(false)
    })

    it('hides at once on focusout', async () => {
      const wrapper = await mountTooltip()
      focusVisible(true)

      await wrapper.find('.target').trigger('focusin')
      await wrapper.find('.target').trigger('focusout')
      await settle()

      expect(isShown()).toBe(false)
    })
  })

  describe('keyboard', () => {
    it('dismisses on Escape without moving focus', async () => {
      const wrapper = await mountTooltip()
      const target = wrapper.find('.target').element as HTMLElement
      target.focus()

      await wrapper.trigger('mouseenter')
      keydown(window, 'Escape')
      await settle()

      expect(isShown()).toBe(false)
      expect(document.activeElement).toBe(target)
    })
  })

  describe('content', () => {
    // CT-07: an empty bubble is not a tooltip.
    it('does not show without text or a content slot', async () => {
      const wrapper = await mountTooltip({ text: '' })

      await wrapper.trigger('mouseenter')

      expect(isShown()).toBe(false)
    })

    it('does not show while disabled, and hides when it becomes disabled', async () => {
      const wrapper = await mountTooltip({ text: 'Hint', disabled: true })
      await wrapper.trigger('mouseenter')
      expect(isShown()).toBe(false)

      await wrapper.setProps({ disabled: false })
      await wrapper.trigger('mouseenter')
      expect(isShown()).toBe(true)

      await wrapper.setProps({ disabled: true })
      await settle()
      expect(isShown()).toBe(false)
    })
  })

  describe('v-model:open', () => {
    it('shows and hides from the model and reports its own changes', async () => {
      const open = ref(false)
      const Harness = defineComponent({
        setup: () => () => h(MTooltip, { 'text': 'Hint', 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, {
          default: () => h('button', { class: 'target' }, 'Trigger'),
        }),
      })
      await mountTracked(Harness, { attachTo: document.body })

      open.value = true
      await settle()
      expect(isShown()).toBe(true)

      keydown(window, 'Escape')
      await settle()
      expect(open.value).toBe(false)
    })
  })

  describe('one at a time', () => {
    it('hides a shown tooltip when another one shows', async () => {
      const Harness = defineComponent({
        setup: () => () => h('div', [
          h(MTooltip, { text: 'First', class: 'first' }, { default: () => h('button', 'A') }),
          h(MTooltip, { text: 'Second', class: 'second' }, { default: () => h('button', 'B') }),
        ]),
      })
      const wrapper = await mountTracked(Harness, { attachTo: document.body })

      await wrapper.find('.first').trigger('mouseenter')
      await wrapper.find('.second').trigger('mouseenter')
      await settle()

      const shown = Array.from(document.querySelectorAll<HTMLElement>('.ui-tooltip__content')).filter(el => el.style.display !== 'none')
      expect(shown.map(el => el.textContent?.trim())).toEqual(['Second'])
    })
  })

  describe('touch', () => {
    it('shows on a long press and swallows the click that follows', async () => {
      const clicks: number[] = []
      const wrapper = await mountTooltip({ text: 'Hint' }, { default: () => h('button', { class: 'target', onClick: () => clicks.push(1) }, 'Trigger') })
      const target = wrapper.find('.target').element as HTMLElement

      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
      await new Promise(resolve => setTimeout(resolve, 600))
      target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
      target.click()

      expect(isShown()).toBe(true)
      expect(clicks).toEqual([])
    })

    it('leaves a short tap to the trigger', async () => {
      const clicks: number[] = []
      const wrapper = await mountTooltip({ text: 'Hint' }, { default: () => h('button', { class: 'target', onClick: () => clicks.push(1) }, 'Trigger') })
      const target = wrapper.find('.target').element as HTMLElement

      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
      target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
      target.click()
      await new Promise(resolve => setTimeout(resolve, 600))

      expect(isShown()).toBe(false)
      expect(clicks).toEqual([1])
    })
  })

  describe('teleport', () => {
    it('renders the surface into the overlay host', async () => {
      await mountTooltip()

      expect(overlayHost().contains(surface())).toBe(true)
    })
  })
})
