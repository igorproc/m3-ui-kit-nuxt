import { afterEach, describe, expect, it } from 'vitest'
import { field, mount, native, pick, unmount } from './helpers'

afterEach(unmount)

describe('m-file-input · a11y', () => {
  describe('names', () => {
    it('names the field with its label', async () => {
      const wrapper = await mount({ label: 'Attachments' })

      expect(wrapper.find(`label[for="${field(wrapper).attributes('id')}"]`).text()).toBe('Attachments')
    })

    it('names the browse button with its text and describes it by the field label', async () => {
      const wrapper = await mount({ label: 'Attachments', browseLabel: 'Browse' })
      const browse = wrapper.find('button')
      const description = browse.attributes('aria-describedby')!

      expect(browse.text()).toBe('Browse')
      expect(wrapper.find(`[id="${description}"]`).text()).toBe('Attachments')
    })

    it('falls back to an icon button named after the field without a browse label', async () => {
      const wrapper = await mount({ label: 'Attachments' })

      expect(wrapper.find('button').attributes('aria-label')).toBe('Attachments')
    })

    it('names the clear button from clearLabel', async () => {
      const wrapper = await mount({ modelValue: new File(['a'], 'a.txt'), clearLabel: 'Remove' })

      expect(wrapper.find('[aria-label="Remove"]').element.tagName).toBe('BUTTON')
    })

    it('keeps the label echo out of sight but in reach of its id', async () => {
      const wrapper = await mount({ label: 'Attachments', browseLabel: 'Browse' })
      const echo = wrapper.find(`[id="${wrapper.find('button').attributes('aria-describedby')}"]`)

      expect(echo.attributes('hidden')).toBeDefined()
    })
  })

  describe('native input', () => {
    it('is out of the tab order and hidden from assistive tech — the field is the control', async () => {
      const wrapper = await mount()

      expect(native(wrapper).attributes('tabindex')).toBe('-1')
      expect(native(wrapper).attributes('aria-hidden')).toBe('true')
    })
  })

  describe('validity', () => {
    it('marks the field invalid while a refusal shows, and announces it', async () => {
      const wrapper = await mount({ accept: 'image/*', rejectMessages: { type: 'not an image' } })

      await pick(wrapper, [new File(['x'], 'note.txt', { type: 'text/plain' })])

      expect(field(wrapper).attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('[role="alert"]').text()).toBe('note.txt: not an image')
    })

    it('describes the field by the support line', async () => {
      const wrapper = await mount({ helperText: 'PDF up to 5 MB' })

      expect(field(wrapper).attributes('aria-describedby')).toBe(wrapper.find('.ui-text-field__support').attributes('id'))
    })

    it('says the field is required', async () => {
      const wrapper = await mount({ label: 'Attachments', required: true })

      expect(field(wrapper).attributes('aria-required')).toBe('true')
    })

    it('shows an app error in the alert region', async () => {
      const wrapper = await mount({ errorMessage: 'Attach the contract' })

      expect(wrapper.find('[role="alert"]').text()).toBe('Attach the contract')
      expect(field(wrapper).attributes('aria-invalid')).toBe('true')
    })
  })

  describe('disabled', () => {
    it('disables the field and both buttons natively', async () => {
      const wrapper = await mount({ disabled: true, modelValue: new File(['a'], 'a.txt'), browseLabel: 'Browse', clearLabel: 'Remove' })

      expect(field(wrapper).attributes('disabled')).toBeDefined()
      expect(wrapper.findAll('.ui-file-input__actions button').every(button => button.attributes('disabled') !== undefined)).toBe(true)
    })
  })
})
