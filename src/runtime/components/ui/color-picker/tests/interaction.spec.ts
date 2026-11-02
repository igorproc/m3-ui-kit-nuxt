import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

async function slide(wrapper: Awaited<ReturnType<typeof mountPicker>>['wrapper'], selector: string, value: string) {
  const range = wrapper.find(selector)
  ;(range.element as HTMLInputElement).value = value
  await range.trigger('input')
  await nextTick()
}

describe('m-color-picker · interaction', () => {
  describe('model', () => {
    it('drives the hue slider to update the model', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000' })

      await slide(wrapper, '.ui-color-picker__hue', '120')

      // Hue 120 on a fully saturated/bright red yields green.
      expect(model.value).toBe('#00ff00')
    })

    it('drives the alpha slider in an alpha format', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000ff', format: 'hexa' })

      await slide(wrapper, '.ui-color-picker__alpha', '0.5')

      expect(model.value).toBe('#ff000080')
    })

    it('emits change when a slider is let go', async () => {
      const { changes, wrapper } = await mountPicker({ modelValue: '#ff0000' })

      await slide(wrapper, '.ui-color-picker__hue', '120')
      await wrapper.find('.ui-color-picker__hue').trigger('change')

      expect(changes.at(-1)).toBe('#00ff00')
    })

    it('reformats the model when the format changes', async () => {
      const { model, format } = await mountPicker({ modelValue: '#ff0000', format: 'hex' })

      format.value = 'rgb'
      await nextTick()

      expect(model.value).toBe('rgb(255, 0, 0)')
    })

    // B7.2a: the user chose another format, and the model was rewritten.
    it('emits change when the format selector rewrites the model', async () => {
      const { model, changes, wrapper } = await mountPicker({ modelValue: '#ff0000', format: 'hex' })

      wrapper.findComponent({ name: 'MDropdown' }).vm.$emit('update:modelValue', 'rgb')
      await nextTick()

      expect(model.value).toBe('rgb(255, 0, 0)')
      expect(changes.at(-1)).toBe('rgb(255, 0, 0)')
    })

    it('emits no change when the parent switches the format', async () => {
      const { changes, format } = await mountPicker({ modelValue: '#ff0000', format: 'hex' })

      format.value = 'rgb'
      await nextTick()

      expect(changes).toEqual([])
    })

    it('follows a model written from outside', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000' })

      model.value = '#0000ff'
      await nextTick()

      expect((wrapper.find('.ui-color-edit input').element as HTMLInputElement).value).toBe('#0000ff')
    })
  })

  describe('swatches', () => {
    it('selects a swatch, updating the model and emitting change', async () => {
      const { model, changes, wrapper } = await mountPicker({ modelValue: '#000000', swatches: ['#ff0000', '#00ff00'] })

      await wrapper.findAll('.ui-color-swatches__item')[0]!.trigger('click')
      await nextTick()

      expect(model.value).toBe('#ff0000')
      expect(changes).toContain('#ff0000')
    })

    it('walks the swatches with the arrows from one tab stop and chooses with Enter', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#000000', swatches: ['#ff0000', '#00ff00', '#0000ff'] })
      const list = wrapper.find('[role="listbox"]')

      await list.trigger('focus')
      await list.trigger('keydown', { key: 'ArrowRight' })
      await list.trigger('keydown', { key: 'Enter' })
      await nextTick()

      expect(list.attributes('aria-activedescendant')).toBe(wrapper.findAll('[role="option"]')[1]!.attributes('id'))
      expect(model.value).toBe('#00ff00')
    })

    it('starts the keyboard on the chosen swatch', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#0000ff', swatches: ['#ff0000', '#00ff00', '#0000ff'] })
      const list = wrapper.find('[role="listbox"]')

      await list.trigger('focus')

      expect(list.attributes('aria-activedescendant')).toBe(wrapper.findAll('[role="option"]')[2]!.attributes('id'))
    })
  })

  describe('canvas', () => {
    it('moves an axis of the 2-D field with the keyboard', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000' })
      const brightness = wrapper.findAll('.ui-color-canvas [role="slider"]')[1]!

      await brightness.trigger('keydown', { key: 'End' })
      await brightness.trigger('keydown', { key: 'PageDown' })
      await nextTick()

      expect(brightness.attributes('aria-valuenow')).toBe('90')
      expect(model.value).not.toBe('#ff0000')
    })

    // Plan: arrows ±1, Shift + arrows ±10 — kept in the canvas, not the shared controller.
    it('steps an axis by ten with Shift and an arrow', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#ff0000' })
      const [saturation, brightness] = wrapper.findAll('.ui-color-canvas [role="slider"]')

      await brightness!.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      await saturation!.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
      await nextTick()

      expect(brightness!.attributes('aria-valuenow')).toBe('90')
      expect(saturation!.attributes('aria-valuenow')).toBe('90')

      await brightness!.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(brightness!.attributes('aria-valuenow')).toBe('91')
    })
  })

  describe('value field', () => {
    it('commits a typed value on Enter', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000' })
      const field = wrapper.find('.ui-color-edit input')

      await field.setValue('#00ff00')
      await field.trigger('keydown', { key: 'Enter' })
      await nextTick()

      expect(model.value).toBe('#00ff00')
    })

    it('keeps an unreadable value in the field with the format hint, and Escape puts the last good one back', async () => {
      const { model, invalid, wrapper } = await mountPicker({ modelValue: '#ff0000', messages: { formatHint: 'Use #RRGGBB' } })
      const field = wrapper.find('.ui-color-edit input')

      await field.setValue('#zz')
      await field.trigger('keydown', { key: 'Enter' })
      await nextTick()

      expect((field.element as HTMLInputElement).value).toBe('#zz')
      expect(wrapper.find('.ui-color-edit [role="alert"]').text()).toBe('Use #RRGGBB')
      expect(model.value).toBe('#ff0000')
      expect(invalid.at(-1)?.[0]).toBe('#zz')

      await field.trigger('keydown', { key: 'Escape' })
      await nextTick()

      expect((field.element as HTMLInputElement).value).toBe('#ff0000')
      // A readable value has nothing to say: the line goes with the error (decision 2026-10-19).
      expect(wrapper.find('.ui-color-edit [role="alert"]').exists()).toBe(false)
    })
  })

  describe('disabled and read-only', () => {
    it('takes no change while read-only', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000', readonly: true, swatches: ['#00ff00'] })

      await wrapper.find('.ui-color-swatches__item').trigger('click')
      await slide(wrapper, '.ui-color-picker__hue', '200')

      expect(model.value).toBe('#ff0000')
      expect((wrapper.find('.ui-color-picker__hue').element as HTMLInputElement).value).toBe('0')
    })

    it('takes no change while disabled', async () => {
      const { model, wrapper } = await mountPicker({ modelValue: '#ff0000', disabled: true, swatches: ['#00ff00'] })

      await wrapper.find('.ui-color-swatches__item').trigger('click')

      expect(model.value).toBe('#ff0000')
    })

    it('takes the parts out of the tab order while disabled', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', disabled: true, swatches: ['#ff0000'] })

      expect(wrapper.find('.ui-color-canvas [role="slider"]').attributes('tabindex')).toBe('-1')
      expect(wrapper.find('[role="listbox"]').attributes('tabindex')).toBe('-1')
      expect(wrapper.find('.ui-color-picker__hue').attributes('disabled')).toBeDefined()
    })

    it('keeps every part focusable while read-only', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', readonly: true, swatches: ['#ff0000'] })

      expect(wrapper.find('.ui-color-canvas [role="slider"]').attributes('tabindex')).toBe('0')
      expect(wrapper.find('[role="listbox"]').attributes('tabindex')).toBe('0')
      expect(wrapper.find('.ui-color-picker__hue').attributes('disabled')).toBeUndefined()
    })
  })
})
