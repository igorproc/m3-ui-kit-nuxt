import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MNumberInput from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MNumberInput, { props })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-number-input · a11y', () => {
  describe('naming', () => {
    it('names the control with a real label association', async () => {
      const wrapper = await mount({ label: 'Width' })

      expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('keeps that association when the label becomes the scrub handle', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W' })

      expect(wrapper.find('.ui-number-input__scrub').attributes('for'))
        .toBe(wrapper.find('input').attributes('id'))
    })

    it('hides the decorative required marker from assistive tech', async () => {
      const wrapper = await mount({ label: 'Width', required: true })

      expect(wrapper.find('.ui-number-input__required').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('spinbutton', () => {
    it('exposes the value and its range', async () => {
      const wrapper = await mount({ modelValue: 5, min: 0, max: 10 })
      const input = wrapper.find('input')

      expect(input.attributes('role')).toBe('spinbutton')
      expect(input.attributes('aria-valuenow')).toBe('5')
      expect(input.attributes('aria-valuemin')).toBe('0')
      expect(input.attributes('aria-valuemax')).toBe('10')
    })

    it('omits the bounds it does not have', async () => {
      const wrapper = await mount({ modelValue: 5 })
      const input = wrapper.find('input')

      expect(input.attributes('aria-valuemin')).toBeUndefined()
      expect(input.attributes('aria-valuemax')).toBeUndefined()
    })

    it('reports no value for an empty field', async () => {
      const wrapper = await mount({ modelValue: null })
      const input = wrapper.find('input')

      expect(input.attributes('aria-valuenow')).toBeUndefined()
      expect(input.attributes('aria-valuetext')).toBeUndefined()
    })

    it('reads out the formatted value, not the bare number', async () => {
      const wrapper = await mount({ modelValue: 12345 })

      expect(wrapper.find('input').attributes('aria-valuetext')).toBe('12,345')
    })

    it('is a text input with a numeric keypad, not type=number', async () => {
      const whole = await mount({ step: 1 })
      expect(whole.find('input').attributes('type')).toBe('text')
      expect(whole.find('input').attributes('inputmode')).toBe('numeric')

      const fractional = await mount({ step: 0.1 })
      expect(fractional.find('input').attributes('inputmode')).toBe('decimal')
    })
  })

  describe('stepper controls', () => {
    it('names both controls', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-number-input__stepper--increment').attributes('aria-label')).toBe('Increase value')
      expect(wrapper.find('.ui-number-input__stepper--decrement').attributes('aria-label')).toBe('Decrease value')
    })

    it('takes those names from props, so they can be translated', async () => {
      const wrapper = await mount({ incrementLabel: 'Больше', decrementLabel: 'Меньше' })

      expect(wrapper.find('.ui-number-input__stepper--increment').attributes('aria-label')).toBe('Больше')
      expect(wrapper.find('.ui-number-input__stepper--decrement').attributes('aria-label')).toBe('Меньше')
    })

    it('stays out of the tab order — the spinbutton already covers the keyboard', async () => {
      const wrapper = await mount()

      for (const stepper of wrapper.findAll('.ui-number-input__stepper')) {
        expect(stepper.attributes('tabindex')).toBe('-1')
      }
    })

    it('is a real button, so it never submits a form by accident', async () => {
      const wrapper = await mount()

      for (const stepper of wrapper.findAll('.ui-number-input__stepper')) {
        expect(stepper.attributes('type')).toBe('button')
      }
    })

    it('disables both controls with the field', async () => {
      const wrapper = await mount({ modelValue: 3, disabled: true })

      for (const stepper of wrapper.findAll('.ui-number-input__stepper')) {
        expect(stepper.attributes('disabled')).toBeDefined()
      }
    })

    it('disables both controls in a read-only field too', async () => {
      const wrapper = await mount({ modelValue: 3, readonly: true })

      for (const stepper of wrapper.findAll('.ui-number-input__stepper')) {
        expect(stepper.attributes('disabled')).toBeDefined()
      }
    })
  })

  describe('descriptions', () => {
    it('points aria-describedby at the support line', async () => {
      const wrapper = await mount({ helperText: 'Pixels' })

      expect(wrapper.find('input').attributes('aria-describedby'))
        .toBe(wrapper.find('.ui-number-input__support').attributes('id'))
    })

    it('describes nothing when there is nothing to describe', async () => {
      const wrapper = await mount()

      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
    })

    it('keeps one description id across the helper-to-error swap', async () => {
      const wrapper = await mount({ helperText: 'Pixels' })
      const helperId = wrapper.find('input').attributes('aria-describedby')

      await wrapper.setProps({ errorMessage: 'Out of range' })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe(helperId)
    })
  })

  describe('validity', () => {
    it('marks the control invalid and announces the message', async () => {
      const wrapper = await mount({ errorMessage: 'Out of range' })

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('.ui-number-input__support').attributes('role')).toBe('alert')
    })

    it('treats the error prop as invalid even without a message', async () => {
      const wrapper = await mount({ error: true })

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('leaves a valid field unmarked', async () => {
      const wrapper = await mount({ helperText: 'Pixels' })

      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })

    it('has the live region in place before the error arrives, and never re-roles it', async () => {
      const wrapper = await mount()
      const region = wrapper.find('.ui-number-input__support')

      expect(region.exists()).toBe(true)
      expect(region.attributes('role')).toBe('alert')
      expect(region.text()).toBe('')

      await wrapper.setProps({ errorMessage: 'Out of range' })

      expect(wrapper.find('.ui-number-input__support').element).toBe(region.element)
      expect(region.attributes('role')).toBe('alert')
      expect(region.text()).toBe('Out of range')
    })

    it('says error without colour: a glyph, even with no message', async () => {
      const valid = await mount({ helperText: 'Pixels' })
      expect(valid.find('.ui-number-input__support-icon').exists()).toBe(false)

      const bare = await mount({ error: true })
      expect(bare.find('.ui-number-input__support-icon').exists()).toBe(true)
      expect(bare.find('.ui-number-input__support-icon').attributes('aria-hidden')).toBe('true')
    })

    it('exposes required through both the native attribute and ARIA', async () => {
      const wrapper = await mount({ required: true })
      const input = wrapper.find('input')

      expect(input.attributes('required')).toBeDefined()
      expect(input.attributes('aria-required')).toBe('true')
    })

    it('omits aria-required when the field is optional', async () => {
      const wrapper = await mount()

      expect(wrapper.find('input').attributes('aria-required')).toBeUndefined()
    })
  })

  describe('steppers', () => {
    it('tie themselves to their field, so two fields\' buttons can be told apart', async () => {
      const wrapper = await mount({ label: 'Width' })
      const inputId = wrapper.find('input').attributes('id')
      const labelId = wrapper.find('label').attributes('id')

      for (const stepper of wrapper.findAll('.ui-number-input__stepper')) {
        expect(stepper.attributes('aria-controls')).toBe(inputId)
        expect(stepper.attributes('aria-describedby')).toBe(labelId)
      }
    })

    it('describe nothing when the field has no visible label to point at', async () => {
      const wrapper = await mount({ 'aria-label': 'Width' })

      expect(wrapper.find('.ui-number-input__stepper').attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('scrub', () => {
    it('leaves the value typable — the gesture is never the only way in', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 240 })
      const input = wrapper.find('input')

      expect(input.attributes('readonly')).toBeUndefined()
      expect(input.attributes('role')).toBe('spinbutton')
    })

    it('keeps the handle out of the tab order — it is a label, not a control', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W' })

      expect(wrapper.find('.ui-number-input__scrub').attributes('tabindex')).toBeUndefined()
    })
  })
})
