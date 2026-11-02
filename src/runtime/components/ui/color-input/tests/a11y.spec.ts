import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { addOverlayHost, cleanUp, input, mountInput, typeAndEnter } from './helpers'

beforeEach(addOverlayHost)
afterEach(cleanUp)

describe('m-color-input · a11y', () => {
  describe('field', () => {
    it('names the input with its label', async () => {
      const { wrapper } = await mountInput({ label: 'Accent' })

      expect(wrapper.find(`label[for="${input(wrapper).attributes('id')}"]`).text()).toBe('Accent')
    })

    it('keeps the native text input with no spellcheck or capitalisation on a colour value', async () => {
      const { wrapper } = await mountInput()

      expect(input(wrapper).attributes('type')).toBe('text')
      expect(input(wrapper).attributes('autocomplete')).toBe('off')
      expect(input(wrapper).attributes('spellcheck')).toBe('false')
      expect(input(wrapper).attributes('autocapitalize')).toBe('none')
    })

    it('says which forms it takes when a typed value cannot be read', async () => {
      const { wrapper } = await mountInput({ modelValue: '#111111', formatHint: 'Use #RRGGBB, rgb() or hsl()' })

      await typeAndEnter(wrapper, 'nonsense')
      await nextTick()

      expect(wrapper.find('[role="alert"]').text()).toBe('Use #RRGGBB, rgb() or hsl()')
      expect(input(wrapper).attributes('aria-invalid')).toBe('true')
    })

    it('announces the app\'s error in the alert region', async () => {
      const { wrapper } = await mountInput({ errorMessage: 'Pick a brand colour' })

      expect(wrapper.find('[role="alert"]').text()).toBe('Pick a brand colour')
      expect(input(wrapper).attributes('aria-invalid')).toBe('true')
    })
  })

  describe('swatch button', () => {
    it('names the swatch button from its prop, with no copy of its own', async () => {
      const named = await mountInput({ pickerLabel: 'Pick a colour' })
      expect(named.wrapper.find('.ui-color-input__trigger').attributes('aria-label')).toBe('Pick a colour')

      const bare = await mountInput({ pickerLabel: undefined })
      expect(bare.wrapper.find('.ui-color-input__trigger').attributes('aria-label')).toBeUndefined()
    })

    it('is a native button that says it opens a dialog and whether it is open', async () => {
      const { wrapper } = await mountInput({ modelValue: '#6750a4' })
      const trigger = wrapper.find('.ui-color-input__trigger')

      expect(trigger.element.tagName).toBe('BUTTON')
      expect(trigger.attributes('type')).toBe('button')
      expect(trigger.attributes('aria-haspopup')).toBe('dialog')
      expect(trigger.attributes('aria-expanded')).toBe('false')

      await trigger.trigger('click')
      await nextTick()

      expect(trigger.attributes('aria-expanded')).toBe('true')
    })

    it.each(['disabled', 'readonly'] as const)('is disabled while the field is %s', async (state) => {
      const { wrapper } = await mountInput({ [state]: true })

      expect(wrapper.find('.ui-color-input__trigger').attributes('disabled')).toBeDefined()
    })
  })

  describe('picker', () => {
    // Q16-Б: a set of controls is a dialog, not a menu.
    it('opens a named dialog, not a menu', async () => {
      await mountInput({ modelValue: '#6750a4', open: true, pickerLabel: 'Pick a colour' })
      await nextTick()

      const surface = document.querySelector('.ui-popover__surface')!
      expect(surface.getAttribute('role')).toBe('dialog')
      expect(surface.getAttribute('aria-label')).toBe('Pick a colour')
      expect(document.querySelector('[role="menu"]')).toBeNull()
    })

    it('names the picker it opens like the button', async () => {
      await mountInput({ modelValue: '#6750a4', open: true, pickerLabel: 'Pick a colour' })
      await nextTick()

      expect(document.querySelector('.ui-color-picker')!.getAttribute('aria-label')).toBe('Pick a colour')
    })
  })
})
