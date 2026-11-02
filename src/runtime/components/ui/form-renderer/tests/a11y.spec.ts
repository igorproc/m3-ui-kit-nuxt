import { afterEach, describe, expect, it } from 'vitest'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'
import { ALL_FIELDS, mountForm, settle, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-form-renderer · a11y', () => {
  describe('structure', () => {
    it('is a native form, so Enter submits it', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!])

      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('form button[type="submit"]').exists()).toBe(true)
    })

    it('groups a radio field’s options under one name, so the arrows move between them', async () => {
      const wrapper = await mountForm([ALL_FIELDS[6]!])
      const names = wrapper.findAll('input[type="radio"]').map(input => input.attributes('name'))

      expect(names).toEqual(['plan', 'plan'])
      expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    })

    it('names a radio field’s options by a fieldset legend', async () => {
      const wrapper = await mountForm([ALL_FIELDS[6]!])
      const fieldset = wrapper.find('fieldset')

      expect(fieldset.find('legend').text()).toBe('Plan')
      expect(fieldset.findAll('input[type="radio"]')).toHaveLength(2)
    })

    it('names the radiogroup itself by that legend', async () => {
      const wrapper = await mountForm([ALL_FIELDS[6]!])
      const legend = wrapper.find('legend')

      expect(legend.attributes('id')).toBeTruthy()
      expect(wrapper.find('[role="radiogroup"]').attributes('aria-labelledby')).toBe(legend.attributes('id'))
    })
  })

  describe('submit result', () => {
    it('keeps a status region mounted from the first frame, empty until there is a result', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!])
      const region = wrapper.find('form [role="status"]')

      expect(region.exists()).toBe(true)
      expect(region.text()).toBe('')
    })

    it('words the result with statusText', async () => {
      const wrapper = await mountForm([ALL_FIELDS[0]!], { statusText: 'Saved' })

      expect(wrapper.find('form [role="status"]').text()).toBe('Saved')
    })
  })

  describe('naming', () => {
    it('associates every text field with its label', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'email', label: 'Email' }])
      const input = wrapper.find('input')

      expect(wrapper.find(`label[for="${input.attributes('id')}"]`).text()).toContain('Email')
    })

    it('names checkboxes and switches by their wrapping label', async () => {
      const wrapper = await mountForm([ALL_FIELDS[4]!, ALL_FIELDS[5]!])

      expect(wrapper.find('.ui-checkbox label, label.ui-checkbox').text()).toContain('Terms')
      expect(wrapper.find('.ui-switch label, label.ui-switch').text()).toContain('News')
    })
  })

  describe('error summary', () => {
    const RULED: FormFieldConfig[] = [
      { type: 'text', name: 'name', label: 'Name', rules: { required: 'Enter a name' } },
      { type: 'radio', name: 'plan', label: 'Plan', rules: { required: 'Choose a plan' }, options: [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }] },
      { type: 'text', name: 'city', label: 'City' },
    ]

    it('lists the failing fields in config order above the fields and takes focus', async () => {
      const wrapper = await mountForm(RULED, { errorSummaryTitle: 'Check the form' }, undefined, true)

      await wrapper.find('form').trigger('submit')
      await settle()

      const summary = wrapper.find('.ui-form-renderer-summary')
      expect(summary.exists()).toBe(true)
      expect(wrapper.find('form').element.firstElementChild).toBe(summary.element)
      expect(summary.text()).toContain('Check the form')
      expect(summary.findAll('a').map(link => link.text())).toEqual(['Name: Enter a name', 'Plan: Choose a plan'])
      expect(document.activeElement).toBe(summary.element)
      expect(summary.attributes('tabindex')).toBe('-1')
    })

    it('links each line to its field and gives the field focus', async () => {
      const wrapper = await mountForm(RULED, {}, undefined, true)

      await wrapper.find('form').trigger('submit')
      await settle()

      const radio = wrapper.find('input[type="radio"]')
      const link = wrapper.findAll('.ui-form-renderer-summary a')[1]!
      expect(link.attributes('href')).toBe(`#${radio.attributes('id')}`)

      await link.trigger('click')
      expect(document.activeElement).toBe(radio.element)
    })

    it('is gone once a submit passes', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name', rules: { required: true } }], {}, undefined, true)

      await wrapper.find('form').trigger('submit')
      await settle()
      expect(wrapper.find('.ui-form-renderer-summary').exists()).toBe(true)

      await wrapper.find('input').setValue('Ada')
      await wrapper.find('form').trigger('submit')
      await settle()
      expect(wrapper.find('.ui-form-renderer-summary').exists()).toBe(false)
    })
  })

  describe('validity', () => {
    it('marks a failing field invalid after a submit attempt', async () => {
      const wrapper = await mountForm([{ type: 'text', name: 'name', label: 'Name', rules: { required: true } }])

      await wrapper.find('form').trigger('submit')
      await settle()

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })
  })
})
