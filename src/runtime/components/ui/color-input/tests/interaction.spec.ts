import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { addOverlayHost, cleanUp, input, mountInput, typeAndEnter } from './helpers'

beforeEach(addOverlayHost)
afterEach(cleanUp)

describe('m-color-input · interaction', () => {
  describe('typed value', () => {
    it('commits a valid draft on Enter and emits change', async () => {
      const { model, changes, wrapper } = await mountInput({ format: 'hex' })

      await typeAndEnter(wrapper, '#00ff00')
      await nextTick()

      expect(model.value).toBe('#00ff00')
      expect(changes).toContain('#00ff00')
    })

    it('writes a typed value in the chosen format', async () => {
      const { model, wrapper } = await mountInput({ format: 'rgb' })

      await typeAndEnter(wrapper, '#00ff00')
      await nextTick()

      expect(model.value).toBe('rgb(0, 255, 0)')
    })

    it('follows the typed family on auto', async () => {
      const { model, wrapper } = await mountInput({ format: 'auto' })

      await typeAndEnter(wrapper, 'rgb(0, 0, 255)')
      await nextTick()

      expect(model.value).toBe('rgb(0, 0, 255)')
    })

    it('marks an invalid draft as error and emits invalid without touching the model', async () => {
      const { model, invalid, wrapper } = await mountInput({ modelValue: '#111111' })

      await typeAndEnter(wrapper, 'nonsense')
      await nextTick()

      expect(invalid).toEqual(['nonsense'])
      expect(model.value).toBe('#111111')
      expect(wrapper.find('.ui-text-field').classes()).toContain('ui-text-field--error')
    })

    // B7.2b: auto reads the family of the model it starts with.
    it('starts auto in the family of the model', async () => {
      const { wrapper } = await mountInput({ modelValue: 'rgb(255, 0, 0)', format: 'auto' })

      expect((input(wrapper).element as HTMLInputElement).value).toBe('rgb(255, 0, 0)')
    })

    // B7.2c: leaving the field untouched is not a commit.
    it('commits nothing on a blur that changed nothing', async () => {
      const { model, changes, wrapper } = await mountInput({ modelValue: '#abc' })

      await input(wrapper).trigger('focus')
      await input(wrapper).trigger('blur')
      await nextTick()

      expect(model.value).toBe('#abc')
      expect(changes).toEqual([])
    })

    it('commits an edit on blur', async () => {
      const { model, wrapper } = await mountInput({ modelValue: '#aabbcc' })

      await input(wrapper).trigger('focus')
      await input(wrapper).setValue('#00ff00')
      await input(wrapper).trigger('blur')
      await nextTick()

      expect(model.value).toBe('#00ff00')
    })

    it('rolls an edit back on Escape', async () => {
      const { model, wrapper } = await mountInput({ modelValue: '#111111' })

      await input(wrapper).setValue('nonsense')
      await input(wrapper).trigger('keydown', { key: 'Enter' })
      await input(wrapper).trigger('keydown', { key: 'Escape' })
      await nextTick()

      expect((input(wrapper).element as HTMLInputElement).value).toBe('#111111')
      expect(wrapper.find('.ui-text-field').classes()).not.toContain('ui-text-field--error')
      expect(model.value).toBe('#111111')
    })

    it('leaves Escape to the page when there is nothing to roll back', async () => {
      const { wrapper } = await mountInput({ modelValue: '#111111' })
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })

      input(wrapper).element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('commits every valid draft live with commit="input"', async () => {
      const { model, wrapper } = await mountInput({ commit: 'input' })

      await input(wrapper).trigger('focus')
      await input(wrapper).setValue('#0000ff')
      await nextTick()

      expect(model.value).toBe('#0000ff')
    })
  })

  describe('clearable', () => {
    it('empties the model and emits clear for an empty draft', async () => {
      const { model, events, changes, wrapper } = await mountInput({ modelValue: '#111111', clearable: true })

      await typeAndEnter(wrapper, '')
      await nextTick()

      expect(model.value).toBeNull()
      expect(changes.at(-1)).toBeNull()
      expect(events).toContain('clear')
    })

    it('puts the value back for an empty draft when it cannot be cleared', async () => {
      const { model, wrapper } = await mountInput({ modelValue: '#111111' })

      await typeAndEnter(wrapper, '')
      await nextTick()

      expect(model.value).toBe('#111111')
      expect((input(wrapper).element as HTMLInputElement).value).toBe('#111111')
    })
  })

  describe('picker', () => {
    it('opens the picker popover on the swatch trigger', async () => {
      const { open, events, wrapper } = await mountInput({ modelValue: '#6750a4' })

      await wrapper.find('.ui-color-input__trigger').trigger('click')
      await nextTick()

      expect(open.value).toBe(true)
      expect(events).toContain('open')
      expect(document.querySelector('.ui-color-picker')).not.toBeNull()
    })

    it('draws no second surface inside its popover', async () => {
      const { wrapper } = await mountInput({ modelValue: '#6750a4' })

      await wrapper.find('.ui-color-input__trigger').trigger('click')
      await nextTick()

      expect(document.querySelector('.ui-color-picker')!.classList.contains('ui-color-picker--hosted')).toBe(true)
    })

    it.each(['readonly', 'disabled'] as const)('does not open the picker when %s', async (state) => {
      const { open, wrapper } = await mountInput({ modelValue: '#6750a4', [state]: true })

      await wrapper.find('.ui-color-input__trigger').trigger('click')
      await nextTick()

      expect(open.value).toBe(false)
    })

    it('writes a swatch chosen in the picker into the model and emits change', async () => {
      const { model, changes } = await mountInput({ modelValue: '#000000', swatches: ['#ff0000'], open: true })
      await nextTick()

      ;(document.querySelector('.ui-color-swatches__item') as HTMLElement).click()
      await nextTick()

      expect(model.value).toBe('#ff0000')
      expect(changes).toContain('#ff0000')
    })

    // Q16-Б: a dialog of controls — the panel gives the picker's keys no meaning of its own.
    it('leaves the arrows to the picker and closes on Escape', async () => {
      const { open } = await mountInput({ modelValue: '#ff0000', open: true })
      await nextTick()
      const hue = document.querySelector<HTMLElement>('.ui-color-picker__hue')!

      hue.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      await nextTick()
      expect(open.value).toBe(true)

      hue.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      await nextTick()
      expect(open.value).toBe(false)
    })

    it('emits close when the popover closes', async () => {
      const { open, events } = await mountInput({ modelValue: '#ff0000', open: true })
      await nextTick()

      open.value = false
      await nextTick()

      expect(events).toContain('close')
    })
  })
})
