import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { ALL_FIELDS, mountForm, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-form-renderer · variants', () => {
  describe('fields', () => {
    it('renders one field per config entry, in config order', async () => {
      const wrapper = await mountForm(ALL_FIELDS)
      const form = wrapper.find('form.ui-form-renderer')

      expect(form.exists()).toBe(true)
      expect(form.findAll('.ui-text-field, .ui-textarea, .ui-number-input, .ui-checkbox, .ui-switch, .ui-form-renderer-field__group')).toHaveLength(7)
    })

    it.each([
      ['text', '.ui-text-field'],
      ['number', '.ui-number-input'],
      ['checkbox', '.ui-checkbox'],
      ['switch', '.ui-switch'],
    ] as const)('renders a %s field with its kit control', async (type, selector) => {
      const wrapper = await mountForm([{ type, name: 'field', label: 'Field' }])

      expect(wrapper.find(selector).exists()).toBe(true)
    })

    it('renders a textarea field as a multi-line MTextarea', async () => {
      const wrapper = await mountForm([{ type: 'textarea', name: 'bio', label: 'Bio' }])

      expect(wrapper.find('.ui-textarea textarea').exists()).toBe(true)
      expect(wrapper.find('.ui-text-field').exists()).toBe(false)
    })

    it('renders a search field as a search input', async () => {
      const wrapper = await mountForm([{ type: 'search', name: 'query', label: 'Query' }])

      expect(wrapper.find('input').attributes('type')).toBe('search')
    })

    it('leaves a text field a plain text input', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name' }])

      expect(wrapper.find('input').attributes('type')).toBe('text')
    })

    it('renders a radio field as a fieldset of one radio per option', async () => {
      const wrapper = await mountForm([ALL_FIELDS[6]!])
      const group = wrapper.find('fieldset.ui-form-renderer-field__group')

      expect(group.find('legend').text()).toBe('Plan')
      expect(group.findAll('input[type="radio"]').map(input => input.attributes('value'))).toEqual(['free', 'pro'])
      expect(group.findAll('.ui-radio__label').map(label => label.text())).toEqual(['Free', 'Pro'])
    })

    it('renders a select field as an MDropdown over its options (W30-А)', async () => {
      const wrapper = await mountForm([{ type: 'select', name: 'city', label: 'City', default: 'spb', options: [{ label: 'Moscow', value: 'msk' }, { label: 'Saint Petersburg', value: 'spb' }] }])

      expect(wrapper.find('.ui-dropdown').exists()).toBe(true)
      expect(wrapper.find('.ui-dropdown').text()).toContain('City')
      expect((wrapper.find('.ui-dropdown input').element as HTMLInputElement).value).toBe('Saint Petersburg')
    })

    it('renders no legend for a radio field without a label', async () => {
      const wrapper = await mountForm([{ type: 'radio', name: 'plan', options: [{ label: 'Free', value: 'free' }] }])

      expect(wrapper.find('legend').exists()).toBe(false)
    })

    it('forwards label and placeholder to a text field', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'email', label: 'Email', placeholder: 'you@example.com' }])

      expect(wrapper.find('label').text()).toContain('Email')
      expect(wrapper.find('input').attributes('placeholder')).toBe('you@example.com')
    })

    it('binds every field to its config name', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'email', label: 'Email' }, { type: 'checkbox', name: 'terms', label: 'Terms' }])

      expect(wrapper.find('input[type="checkbox"]').attributes('name')).toBe('terms')
    })

    it('passes field.props through to the rendered control', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'email', label: 'Email', props: { variant: 'outlined' } }])

      expect(wrapper.find('.ui-text-field').classes()).toContain('ui-text-field--outlined')
    })
  })

  describe('actions', () => {
    it('renders a submit button in the actions row by default', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!])

      expect(wrapper.find('.ui-form-renderer__actions button').attributes('type')).toBe('submit')
    })

    it('labels the default button with submitLabel', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!], { submitLabel: 'Сохранить' })

      expect(wrapper.find('button[type="submit"]').text()).toBe('Сохранить')
    })

    it('ships no English label of its own', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!])

      expect(wrapper.find('button[type="submit"]').text()).toBe('')
    })

    it('lets the default slot replace the actions, with the form state', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!], {}, {
        default: (scope: { pending: boolean, isError: boolean }) => h('span', { class: 'own' }, `${scope.pending}:${scope.isError}`),
      })

      expect(wrapper.find('.ui-form-renderer__actions .own').text()).toBe('false:false')
      expect(wrapper.find('.ui-form-renderer__actions button').exists()).toBe(false)
    })
  })
})
