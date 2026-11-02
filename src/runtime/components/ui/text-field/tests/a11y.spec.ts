import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import MTextField from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTextField, { props, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-text-field · a11y', () => {
  describe('role and name', () => {
    it('relies on the native input role rather than an invented one', async () => {
      const wrapper = await mount({ label: 'Email' })

      expect(wrapper.find('input').attributes('role')).toBeUndefined()
    })

    it('names the input with a real label association', async () => {
      const wrapper = await mount({ label: 'Email' })
      const label = wrapper.find('label.ui-text-field__label')

      expect(label.text()).toBe('Email')
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('keeps a hidden label in the document, and keeps it associated', async () => {
      const wrapper = await mount({ label: 'Search', labelPlacement: 'hidden' })
      const label = wrapper.find('label.ui-text-field__label')

      expect(label.exists()).toBe(true)
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('takes a consumer aria-label on the input when there is no visible label', async () => {
      const wrapper = await mount({}, { 'aria-label': 'Search' })

      expect(wrapper.find('input').attributes('aria-label')).toBe('Search')
    })

    it('takes a consumer aria-labelledby on the input', async () => {
      const wrapper = await mount({}, { 'aria-labelledby': 'heading' })

      expect(wrapper.find('input').attributes('aria-labelledby')).toBe('heading')
    })

    // The dev warning for a nameless field is checked in e2e (`text-field/nameless.e2e.ts`):
    // `import.meta.dev` is false under Vitest.

    it('hides the decorative outline from assistive tech', async () => {
      const wrapper = await mount({ label: 'Email', variant: 'outlined' })

      expect(wrapper.find('.ui-text-field__outline').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('required', () => {
    it('marks a required field with a decorative asterisk and ARIA', async () => {
      const wrapper = await mount({ label: 'Email', required: true, variant: 'outlined' })

      expect(wrapper.find('.ui-text-field__required').attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('input').attributes('aria-required')).toBe('true')
    })

    it('omits aria-required when the field is optional', async () => {
      const wrapper = await mount({ label: 'Email' })

      expect(wrapper.find('input').attributes('aria-required')).toBeUndefined()
    })
  })

  describe('descriptions', () => {
    it('links helper text via aria-describedby', async () => {
      const wrapper = await mount({ helperText: 'Some hint' })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe(wrapper.find('.ui-text-field__support').attributes('id'))
    })

    it('describes the input with the prefix and suffix after the message', async () => {
      const wrapper = await mount({ label: 'Price', prefix: '$', suffix: 'USD', helperText: 'Per item' })
      const ids = wrapper.find('input').attributes('aria-describedby')!.split(' ')

      expect(ids).toEqual([
        wrapper.find('.ui-text-field__support').attributes('id'),
        wrapper.find('.ui-text-field__affix--prefix').attributes('id'),
        wrapper.find('.ui-text-field__affix--suffix').attributes('id'),
      ])
    })

    it('points every description at an element that exists', async () => {
      const wrapper = await mount({ prefix: '$', suffix: 'USD', helperText: 'Hint' })

      for (const id of wrapper.find('input').attributes('aria-describedby')!.split(' ')) {
        expect(wrapper.find(`#${id}`).exists()).toBe(true)
      }
    })

    it('leaves a consumer aria-describedby in place while the field has nothing to describe', async () => {
      const wrapper = await mount({}, { 'aria-describedby': 'hint' })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe('hint')
    })

    it('keeps one description id across the helper-to-error swap', async () => {
      const wrapper = await mount({ helperText: 'Hint' })
      const id = wrapper.find('input').attributes('aria-describedby')

      await wrapper.setProps({ errorMessage: 'Too short' })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe(id)
    })
  })

  describe('validity', () => {
    it('renders an error message, marks the input invalid and sets the alert role', async () => {
      const wrapper = await mount({ errorMessage: 'Required' })
      const support = wrapper.find('.ui-text-field__support')

      expect(support.text()).toBe('Required')
      expect(support.find('[role="alert"]').text()).toBe('Required')
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('input').attributes('aria-describedby')).toBe(support.attributes('id'))
    })

    it('treats the error flag as invalid even without a message', async () => {
      const wrapper = await mount({ error: true })

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('leaves a valid field unmarked', async () => {
      const wrapper = await mount({ helperText: 'Hint' })

      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })

    it('keeps one alert region mounted and writes the error into it', async () => {
      const wrapper = await mount({ helperText: 'Hint' })
      const region = wrapper.find('[role="alert"]')

      // The region exists, empty, before there is anything to announce.
      expect(region.exists()).toBe(true)
      expect(region.text()).toBe('')

      await wrapper.setProps({ errorMessage: 'Too short' })

      expect(wrapper.find('[role="alert"]').element).toBe(region.element)
      expect(region.text()).toBe('Too short')
      expect(wrapper.find('.ui-text-field__support').text()).not.toContain('Hint')
    })

    it('keeps the reserved line in place when the bound error arrives', async () => {
      const wrapper = await mount({ errorMessage: undefined })
      const line = wrapper.find('.ui-text-field__support').element

      await wrapper.setProps({ errorMessage: 'Too short' })

      expect(wrapper.find('.ui-text-field__support').element).toBe(line)
      expect(wrapper.find('[role="alert"]').text()).toBe('Too short')
    })

    it('keeps the helper outside the alert region — it is not announced', async () => {
      const wrapper = await mount({ helperText: 'Hint' })

      expect(wrapper.find('.ui-text-field__support').text()).toBe('Hint')
      expect(wrapper.find('[role="alert"]').text()).toBe('')
    })
  })

  describe('validity is not colour alone', () => {
    it('shows a decorative error glyph', async () => {
      const wrapper = await mount({ error: true })
      const icon = wrapper.find('.ui-text-field__support-icon')

      expect(icon.exists()).toBe(true)
      expect(icon.attributes('aria-hidden')).toBe('true')
    })

    it('leaves the glyph out of a valid field', async () => {
      const wrapper = await mount({ helperText: 'Hint' })

      expect(wrapper.find('.ui-text-field__support-icon').exists()).toBe(false)
    })
  })

  describe('busy', () => {
    it('reports the input busy while the adapter validates asynchronously', async () => {
      const pending: ValidationAdapter = {
        bindField: () => ({
          value: ref(''),
          errorMessage: ref<string | undefined>(undefined),
          meta: { required: false, touched: true, dirty: true, valid: true, validated: false, pending: true },
        }) as never,
        createForm: () => { throw new Error('unused') },
      }
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          provideValidationAdapter(pending)
          return () => h(MTextField, { path: 'email', label: 'Email' })
        },
      }))

      expect(wrapper.find('input').attributes('aria-busy')).toBe('true')
      wrapper.unmount()
    })

    it('leaves aria-busy off a field that is not validating', async () => {
      const wrapper = await mount()

      expect(wrapper.find('input').attributes('aria-busy')).toBeUndefined()
    })
  })

  describe('disabled', () => {
    it('uses the native disabled attribute, which takes the input out of the tab order', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
      expect(wrapper.find('input').attributes('aria-disabled')).toBeUndefined()
    })
  })
})
