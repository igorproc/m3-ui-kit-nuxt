import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MOtpInput from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MOtpInput, { props })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-otp-input · a11y', () => {
  describe('one field, not many', () => {
    it('renders a single input behind the whole grid', async () => {
      const wrapper = await mount({ length: 6 })

      expect(wrapper.findAll('input')).toHaveLength(1)
      expect(wrapper.findAll('.ui-otp-input__field')).toHaveLength(6)
    })

    it('hides every drawn cell from assistive tech — the input already has the value', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12' })

      for (const cell of wrapper.findAll('.ui-otp-input__field')) {
        expect(cell.attributes('aria-hidden')).toBe('true')
      }
    })

    it('hides the separator too', async () => {
      const wrapper = await mount({ length: 4, groups: [2, 2], separator: '–' })

      expect(wrapper.find('.ui-otp-input__separator').attributes('aria-hidden')).toBe('true')
    })

    it('caps the input at the code length, so the platform can autofill it whole', async () => {
      const wrapper = await mount({ length: 6 })

      expect(wrapper.find('input').attributes('maxlength')).toBe('6')
    })

    it('asks the platform for a one-time code', async () => {
      const wrapper = await mount({ length: 6 })

      expect(wrapper.find('input').attributes('autocomplete')).toBe('one-time-code')
    })

    it('offers the keypad that matches the alphabet', async () => {
      const numeric = await mount({ length: 4 })
      expect(numeric.find('input').attributes('inputmode')).toBe('numeric')

      const alphanumeric = await mount({ length: 4, mode: 'alphanumeric' })
      expect(alphanumeric.find('input').attributes('inputmode')).toBe('text')
    })
  })

  describe('naming', () => {
    it('names the input through the label', async () => {
      const wrapper = await mount({ length: 4, label: 'Код из SMS' })
      const label = wrapper.find('label')

      expect(label.text()).toBe('Код из SMS')
      expect(wrapper.find('input').attributes('aria-labelledby')).toBe(label.attributes('id'))
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('keeps a visually hidden label in the accessibility tree', async () => {
      const wrapper = await mount({ length: 4, label: 'Код', labelPlacement: 'hidden' })
      const label = wrapper.find('label')

      expect(label.exists()).toBe(true)
      expect(label.attributes('aria-hidden')).toBeUndefined()
      expect(wrapper.find('input').attributes('aria-labelledby')).toBe(label.attributes('id'))
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`, so it cannot be asserted here without weakening the
    // guard in the component. Left uncovered on purpose.

    it('still renders the label element with no name, so the association survives', async () => {
      const wrapper = await mount({ length: 4 })

      expect(wrapper.find('label').attributes('id'))
        .toBe(wrapper.find('input').attributes('aria-labelledby'))
    })
  })

  describe('validity', () => {
    it('marks the control invalid and announces the message', async () => {
      const wrapper = await mount({ length: 4, errorMessage: 'Код неверный' })

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('.ui-otp-input__message').attributes('role')).toBe('alert')
    })

    it('treats the error prop as invalid even without a message', async () => {
      const wrapper = await mount({ length: 4, error: true })

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('points aria-describedby at the message when there is one', async () => {
      const wrapper = await mount({ length: 4, errorMessage: 'Код неверный' })

      expect(wrapper.find('input').attributes('aria-describedby'))
        .toBe(wrapper.find('.ui-otp-input__message').attributes('id'))
    })

    it('describes nothing when there is nothing to describe', async () => {
      const wrapper = await mount({ length: 4 })

      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })
  })
})
