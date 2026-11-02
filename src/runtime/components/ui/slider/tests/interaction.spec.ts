import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MSlider from '../index.vue'
import { mount, stubRect, thumbs, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

const press = (key: string, extra: Record<string, unknown> = {}) => ['keydown', { key, ...extra }] as const

describe('m-slider · interaction', () => {
  describe('keyboard', () => {
    it.each([
      ['ArrowRight', 45],
      ['ArrowUp', 45],
      ['ArrowLeft', 35],
      ['ArrowDown', 35],
      ['PageUp', 90],
      ['PageDown', 0],
      ['Home', 0],
      ['End', 100],
    ])('%s moves 40 to %s (step 5), with one emit', async (key, expected) => {
      const wrapper = await mount({ modelValue: 40, step: 5 })

      await thumbs(wrapper)[0]!.trigger(...press(key))

      expect(wrapper.emitted('update:modelValue')).toEqual([[expected]])
    })

    it('multiplies the arrow step by ten with Shift', async () => {
      const wrapper = await mount({ modelValue: 40, step: 1 })

      await thumbs(wrapper)[0]!.trigger(...press('ArrowRight', { shiftKey: true }))

      expect(wrapper.emitted('update:modelValue')).toEqual([[50]])
    })

    it('clamps at the bounds without emitting a no-op', async () => {
      const wrapper = await mount({ modelValue: 100 })

      await thumbs(wrapper)[0]!.trigger(...press('ArrowRight'))

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('snaps to the step grid from a custom min', async () => {
      const wrapper = await mount({ modelValue: 13, min: 3, max: 23, step: 5 })

      await thumbs(wrapper)[0]!.trigger(...press('ArrowRight'))

      expect(wrapper.emitted('update:modelValue')).toEqual([[18]])
    })

    it('ignores keys it has no meaning for', async () => {
      const wrapper = await mount({ modelValue: 40 })

      await thumbs(wrapper)[0]!.trigger(...press('a'))

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('range', () => {
    it('moves the thumb the key was pressed on', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80] })

      await thumbs(wrapper)[1]!.trigger(...press('ArrowLeft'))

      expect(wrapper.emitted('update:modelValue')).toEqual([[[20, 79]]])
    })

    it('stops a thumb at its neighbour instead of crossing it', async () => {
      const wrapper = await mount({ range: true, modelValue: [50, 50] })

      await thumbs(wrapper)[0]!.trigger(...press('ArrowRight'))

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('pointer', () => {
    it('jumps the thumb to a press on the track', async () => {
      const wrapper = await mount({ modelValue: 20 })
      const track = wrapper.find('.ui-slider-track')
      stubRect(track.element, { left: 0, width: 200 })

      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0 })

      expect(wrapper.emitted('update:modelValue')).toEqual([[75]])
    })

    it('jumps the nearest thumb of a range', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80] })
      const track = wrapper.find('.ui-slider-track')
      stubRect(track.element, { left: 0, width: 200 })

      await track.trigger('pointerdown', { clientX: 60, clientY: 20, button: 0 })

      expect(wrapper.emitted('update:modelValue')).toEqual([[[30, 80]]])
    })

    it('ignores a secondary button', async () => {
      const wrapper = await mount({ modelValue: 20 })
      const track = wrapper.find('.ui-slider-track')
      stubRect(track.element, { left: 0, width: 200 })

      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 2 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('marks the root as dragging while a thumb is held', async () => {
      const wrapper = await mount({ modelValue: 20 })

      await thumbs(wrapper)[0]!.trigger('pointerdown', { clientX: 40, clientY: 20, button: 0 })

      expect(wrapper.classes()).toContain('ui-slider-root--dragging')
      expect(wrapper.find('.ui-slider-thumb').classes()).toContain('ui-slider-thumb--dragging')
    })
  })

  describe('disabled and readonly', () => {
    it.each(['disabled', 'readonly'] as const)('ignores keys and track presses while %s', async (state) => {
      const wrapper = await mount({ modelValue: 40, [state]: true })
      const track = wrapper.find('.ui-slider-track')
      stubRect(track.element, { left: 0, width: 200 })

      await thumbs(wrapper)[0]!.trigger(...press('ArrowRight'))
      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('focus', () => {
    it('takes focus on the thumb', async () => {
      const wrapper = await mount({ modelValue: 40 }, undefined, true)
      const thumb = thumbs(wrapper)[0]!.element as HTMLElement

      thumb.focus()

      expect(document.activeElement).toBe(thumb)
    })
  })

  describe('server render', () => {
    it('ships the role, the value and the thumb position in the first frame', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MSlider, { modelValue: 25, label: 'Volume' }) }))

      expect(html).toContain('role="slider"')
      expect(html).toContain('aria-valuenow="25"')
      expect(html).toContain('inset-inline-start:25%')
    })
  })
})
