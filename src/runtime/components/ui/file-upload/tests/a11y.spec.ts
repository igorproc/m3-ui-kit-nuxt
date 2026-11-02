import { afterEach, describe, expect, it } from 'vitest'
import { file, flush, messages, mount, pending, pick, unmount } from './helpers'

afterEach(unmount)

describe('m-file-upload · a11y', () => {
  describe('group', () => {
    it('names the whole control as a group, described by the hint', async () => {
      const wrapper = await mount({ label: 'Attachments', hint: 'PDF, up to 5 MB' })
      const group = wrapper.find('[role="group"]')

      expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toMatch(/^Attachments/)
      expect(wrapper.find(`#${group.attributes('aria-describedby')}`).text()).toBe('PDF, up to 5 MB')
    })

    it('points at nothing it does not have', async () => {
      const wrapper = await mount()
      const group = wrapper.find('[role="group"]')

      expect(group.attributes('aria-labelledby')).toBeUndefined()
      expect(group.attributes('aria-describedby')).toBeUndefined()
    })

    it('marks the group disabled, never read-only', async () => {
      const disabled = await mount({ disabled: true })
      expect(disabled.find('[role="group"]').attributes('aria-disabled')).toBe('true')

      const readonly = await mount({ readonly: true })
      expect(readonly.find('[role="group"]').attributes('aria-disabled')).toBeUndefined()
    })

    it('hides the asterisk from assistive tech', async () => {
      const wrapper = await mount({ label: 'Attachments', required: true })

      expect(wrapper.find('.ui-file-upload__required').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('picker', () => {
    it('is out of sight but focusable, so a required one can be reported by the form', async () => {
      const wrapper = await mount({ label: 'Attachments', required: true })
      const picker = wrapper.find('input[type="file"]')

      // A bare native input: a required one inside `hidden` could never be
      // focused, and the form would refuse to submit without saying why.
      expect(picker.classes()).toContain('ui-file-upload__picker')
      expect(picker.element.closest('[hidden]')).toBeNull()
      expect(picker.attributes('tabindex')).toBe('-1')
      expect(picker.attributes('aria-hidden')).toBe('true')
      expect(picker.attributes('required')).toBeDefined()
    })

    it('names the dropzone button after the group when there is no choose phrase', async () => {
      const wrapper = await mount({ label: 'Attachments' })

      expect(wrapper.find('.ui-file-upload__choose').attributes('aria-label')).toBe('Attachments')
    })

    it('describes the dropzone button by the hint', async () => {
      const wrapper = await mount({ hint: 'PDF, up to 5 MB', messages })
      const choose = wrapper.find('.ui-file-upload__choose')

      expect(wrapper.find(`#${choose.attributes('aria-describedby')}`).text()).toBe('PDF, up to 5 MB')
    })

    it.each(['disabled', 'readonly'] as const)('disables the dropzone button while %s', async (state) => {
      const wrapper = await mount({ [state]: true, messages })

      expect(wrapper.find('.ui-file-upload__choose').attributes('disabled')).toBeDefined()
    })
  })

  describe('live regions', () => {
    it('says why a file was refused through a region that was already there', async () => {
      const wrapper = await mount({ accept: 'image/*', messages })
      const region = wrapper.find('.ui-file-upload__rejection')

      expect(region.attributes('role')).toBe('alert')
      expect(region.text()).toBe('')

      await pick(wrapper, [file('notes.txt')])

      expect(wrapper.find('.ui-file-upload__rejection').element).toBe(region.element)
      expect(region.text()).toBe('notes.txt: type not allowed')
      expect(region.find('.ui-file-upload__rejection-icon').attributes('aria-hidden')).toBe('true')
    })

    it('announces each status change through one status region', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve(), autoStart: true, messages })
      const status = wrapper.find('.ui-file-upload__status')
      await flush()
      await flush()

      expect(status.attributes('role')).toBe('status')
      expect(status.text()).toBe('a.txt · Uploaded')
    })

    it('stays silent without a status word', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve(), autoStart: true })
      await flush()
      await flush()

      expect(wrapper.find('.ui-file-upload__status').text()).toBe('')
    })
  })

  describe('queue', () => {
    it('names the queue list by messages', async () => {
      const wrapper = await mount({ messages })

      expect(wrapper.find('.ui-file-upload__list').attributes('aria-label')).toBe('Upload queue')
    })

    it('names every row action after its file and disables them all when disabled', async () => {
      const wrapper = await mount({ modelValue: [file('contract.pdf')], upload: pending, messages, disabled: true })
      const actions = wrapper.findAll('.ui-file-upload__item-actions button')

      expect(actions.map(action => action.attributes('aria-label'))).toEqual(['Start contract.pdf', 'Remove contract.pdf'])
      for (const action of actions) expect(action.attributes('disabled')).toBeDefined()
    })

    it('names the cancel action after the uploading file', async () => {
      const wrapper = await mount({ modelValue: [file('contract.pdf')], upload: pending, autoStart: true, messages })

      expect(wrapper.find('.ui-file-upload__action--cancel').attributes('aria-label')).toBe('Cancel contract.pdf')
    })

    it('names the progress bar after its file', async () => {
      const wrapper = await mount({ modelValue: [file('contract.pdf')], upload: pending, autoStart: true, messages })

      expect(wrapper.find('.ui-file-upload__item [role="progressbar"]').attributes('aria-label')).toBe('contract.pdf')
    })

    it('hides the status glyph — the words say it', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages })

      expect(wrapper.find('.ui-file-upload__item-icon').attributes('aria-hidden')).toBe('true')
    })
  })
})
