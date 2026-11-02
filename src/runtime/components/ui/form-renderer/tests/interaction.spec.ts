import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useFormSchema } from '#kit/composables/useFormSchema'
import { mountForm, settle, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-form-renderer · interaction', () => {
  describe('submit', () => {
    it('hands the values to onSubmit once the form is valid', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([
        { type: 'text', name: 'name', label: 'Name', rules: { required: true } },
        { type: 'checkbox', name: 'terms', label: 'Terms', default: true },
      ], { onSubmit })

      await wrapper.find('input').setValue('Ada')
      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0]![0]).toEqual({ name: 'Ada', terms: true })
    })

    it('does not submit while a rule fails, and shows why', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name', rules: { required: 'Name is required' } }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit).not.toHaveBeenCalled()
      expect(wrapper.find('.ui-text-field').text()).toContain('Name is required')
    })

    it('emits submitted with the values once onSubmit is done', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name', default: 'Ada' }])

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(wrapper.findComponent({ name: 'MFormRenderer' }).emitted('submitted')?.[0]).toEqual([{ name: 'Ada' }])
    })

    it('emits invalid with the messages when validation stops the submit', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name', rules: { required: 'Name is required' } }])

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(wrapper.findComponent({ name: 'MFormRenderer' }).emitted('invalid')?.[0]).toEqual([{ name: 'Name is required' }])
    })

    it('reports the form busy while onSubmit runs', async () => {
      let resolve: () => void = () => {}
      const onSubmit = vi.fn(() => new Promise<void>((done) => {
        resolve = done
      }))
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name' }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()
      expect(wrapper.find('form').attributes('aria-busy')).toBe('true')

      resolve()
      await settle()
      expect(wrapper.find('form').attributes('aria-busy')).toBeUndefined()
    })

    it('keeps the submit button busy while onSubmit is pending', async () => {
      let resolve: () => void = () => {}
      const onSubmit = vi.fn(() => new Promise<void>((done) => {
        resolve = done
      }))
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name' }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()
      expect(wrapper.find('button[type="submit"]').attributes('aria-busy')).toBe('true')

      resolve()
      await settle()
      expect(wrapper.find('button[type="submit"]').attributes('aria-busy')).toBeUndefined()
    })
  })

  describe('numbers', () => {
    it('submits an optional number left empty as null', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([{ type: 'number', name: 'age', label: 'Age' }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0]![0]).toEqual({ age: null })
    })

    it('still refuses an empty required number', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([{ type: 'number', name: 'age', label: 'Age', rules: { required: 'Age is required' } }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('radio field', () => {
    it('submits the chosen option', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([{ type: 'radio', name: 'plan', options: [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }] }], { onSubmit })

      await wrapper.findAll('input[type="radio"]')[1]!.trigger('change')
      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit.mock.calls[0]![0]).toEqual({ plan: 'pro' })
    })

    it('shows one error for the whole field, not one per option', async () => {
      const wrapper = await mountForm([{ type: 'radio', name: 'plan', rules: { required: 'Pick a plan' }, options: [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }] }])

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(wrapper.findAll('.ui-choice-support')).toHaveLength(1)
      expect(wrapper.find('.ui-choice-support').text()).toBe('Pick a plan')
    })
  })

  describe('select field', () => {
    it('submits the chosen option value', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([{ type: 'select', name: 'city', default: 'msk', options: [{ label: 'Moscow', value: 'msk' }, { label: 'Kazan', value: 'kzn' }] }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit.mock.calls[0]![0]).toEqual({ city: 'msk' })
    })

    it('refuses a value outside its options', async () => {
      const onSubmit = vi.fn()
      const wrapper = await mountForm([{ type: 'select', name: 'city', default: 'nowhere', options: [{ label: 'Moscow', value: 'msk' }] }], { onSubmit })

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('model', () => {
    it('seeds the fields from v-model over their defaults', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name', default: 'Ada' }], { modelValue: { name: 'Grace' } })

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Grace')
    })

    it('writes what the user types back to v-model', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name' }])

      await wrapper.find('input').setValue('Ada')
      await settle()

      expect(wrapper.findComponent({ name: 'MFormRenderer' }).emitted('update:modelValue')?.at(-1)).toEqual([{ name: 'Ada' }])
    })
  })

  describe('defaults', () => {
    it('starts each field from its config default', async () => {
      const wrapper = await mountForm([
        { type: 'text', name: 'name', label: 'Name', default: 'Ada' },
        { type: 'switch', name: 'news', label: 'News', default: true },
      ])

      expect((wrapper.find('.ui-text-field input').element as HTMLInputElement).value).toBe('Ada')
      expect(wrapper.find('.ui-switch').classes()).toContain('ui-switch--checked')
    })

    it('starts a radio field with nothing chosen', async () => {
      const wrapper = await mountForm([{ type: 'radio', name: 'plan', options: [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }] }])

      expect(wrapper.findAll('input[type="radio"]').some(input => (input.element as HTMLInputElement).checked)).toBe(false)
    })
  })

  describe('adapter', () => {
    it('refuses to build a form without a validation adapter', async () => {
      let error: unknown
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          try {
            useFormSchema([{ type: 'text', name: 'name' }])
          } catch (caught) {
            error = caught
          }
          return () => h('div')
        },
      }))

      expect(String(error)).toMatch(/validation adapter/)
      wrapper.unmount()
    })
  })
})
