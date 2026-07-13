import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTextarea from '../app/components/ui/textarea/index.vue'

describe('m-textarea', () => {
  it('renders native multiline semantics and updates the model', async () => {
    const wrapper = await mountSuspended(MTextarea, {
      props: { rows: 4, name: 'description', wrap: 'hard' },
    })
    const textarea = wrapper.find('textarea.ui-textarea__input')

    expect(textarea.attributes('rows')).toBe('4')
    expect(textarea.attributes('name')).toBe('description')
    expect(textarea.attributes('wrap')).toBe('hard')

    await textarea.setValue('Multiline')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Multiline'])
  })

  it('reuses the shared outlined field chrome', async () => {
    const wrapper = await mountSuspended(MTextarea, {
      props: { variant: 'outlined', label: 'Description' },
    })

    expect(wrapper.classes()).toContain('ui-textarea--outlined')
    expect(wrapper.find('.ui-field__control--outlined').exists()).toBe(true)
    expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('textarea').attributes('id'))
  })

  it('renders helper and counter ids in aria-describedby', async () => {
    const wrapper = await mountSuspended(MTextarea, {
      props: { helperText: 'Hint', maxlength: 20, counter: true, modelValue: 'abc' },
    })
    const describedBy = wrapper.find('textarea').attributes('aria-describedby')

    expect(wrapper.find('.ui-textarea__counter').text()).toBe('3 / 20')
    expect(describedBy).toContain(wrapper.find('.ui-field__helper').attributes('id'))
    expect(describedBy).toContain(wrapper.find('.ui-textarea__counter').attributes('id'))
  })

  it('supports a numeric display counter without native maxlength', async () => {
    const wrapper = await mountSuspended(MTextarea, {
      props: { counter: 100, modelValue: 'hello' },
    })

    expect(wrapper.find('textarea').attributes('maxlength')).toBeUndefined()
    expect(wrapper.find('.ui-textarea__counter').text()).toBe('5 / 100')
  })

  it('maps resize modes and disables manual resize for auto-grow', async () => {
    const manual = await mountSuspended(MTextarea, { props: { resize: 'vertical' } })
    expect(manual.find('textarea').classes()).toContain('ui-textarea__input--resize-vertical')

    const automatic = await mountSuspended(MTextarea, {
      props: { autoGrow: true, resize: 'both', rows: 2, maxRows: 4 },
    })
    expect(automatic.find('textarea').classes()).toContain('ui-textarea__input--resize-none')
  })

  it('forwards native readonly, disabled and autocomplete attributes', async () => {
    const wrapper = await mountSuspended(MTextarea, {
      props: { readonly: true, disabled: true, autocomplete: 'off' },
    })
    const textarea = wrapper.find('textarea')

    expect(textarea.attributes('readonly')).toBeDefined()
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.attributes('autocomplete')).toBe('off')
  })
})
