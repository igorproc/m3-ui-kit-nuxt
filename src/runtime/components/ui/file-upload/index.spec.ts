import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFileUpload from './index.vue'
import { useFileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'

const file = (name: string, type = 'text/plain') => new File(['data'], name, { type, lastModified: 1 })
const flush = async () => {
  await Promise.resolve()
  await nextTick()
}

const messages = {
  queue: 'Upload queue',
  choose: 'Choose files',
  status: { queued: 'Queued', uploading: 'Uploading', success: 'Uploaded', error: 'Failed', cancelled: 'Cancelled' },
  reject: { type: 'type not allowed', size: 'too large' },
  start: 'Start {name}',
  cancel: 'Cancel {name}',
  retry: 'Retry {name}',
  remove: 'Remove {name}',
}

describe('m-file-upload', () => {
  it('renders one picker, out of sight but focusable, and names the whole control as a group', async () => {
    const wrapper = await mountSuspended(MFileUpload, { props: { label: 'Attachments', hint: 'PDF, up to 5 MB', required: true } })
    const group = wrapper.find('[role="group"]')
    const picker = wrapper.find('input[type="file"]')

    expect(wrapper.findAll('input[type="file"]')).toHaveLength(1)
    // A bare native input: a required one inside `hidden` could never be
    // focused, and the form would refuse to submit without saying why.
    expect(picker.classes()).toContain('ui-file-upload__picker')
    expect(picker.element.closest('[hidden]')).toBeNull()
    expect(picker.attributes('tabindex')).toBe('-1')
    expect(picker.attributes('required')).toBeDefined()
    expect(wrapper.find('.ui-file-input').exists()).toBe(false)
    expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toMatch(/^Attachments/)
    expect(wrapper.find(`#${group.attributes('aria-describedby')}`).text()).toBe('PDF, up to 5 MB')
  })

  it('ships no copy of its own', async () => {
    const wrapper = await mountSuspended(MFileUpload, { props: { label: 'Attachments' } })

    expect(wrapper.find('.ui-file-upload__dropzone-text').exists()).toBe(false)
    expect(wrapper.find('.ui-file-upload__empty').exists()).toBe(false)
    // The dropzone button falls back to an icon named after the group.
    expect(wrapper.find('.ui-file-upload__choose').attributes('aria-label')).toBe('Attachments')
  })

  it('says why a file was refused, beside the dropzone, through a region that was already there', async () => {
    const wrapper = await mountSuspended(MFileUpload, { props: { accept: 'image/*', messages } })
    const region = wrapper.find('.ui-file-upload__rejection')

    expect(region.attributes('role')).toBe('alert')
    expect(region.text()).toBe('')

    const native = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(native, 'files', { configurable: true, value: [file('notes.txt')] })
    await wrapper.find('input[type="file"]').trigger('change')

    expect(wrapper.find('.ui-file-upload__rejection').element).toBe(region.element)
    expect(region.text()).toBe('notes.txt: type not allowed')
  })

  it('starts the files already in the model when auto-start is on', async () => {
    const upload = vi.fn(() => new Promise<void>(() => {}))
    await mountSuspended(MFileUpload, { props: { modelValue: [file('a.txt')], upload, autoStart: true } })

    expect(upload).toHaveBeenCalledTimes(1)
  })

  it('empties the queue when the model is emptied from outside', async () => {
    const wrapper = await mountSuspended(MFileUpload, { props: { modelValue: [file('a.txt'), file('b.txt')], messages } })
    expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(2)

    await wrapper.setProps({ modelValue: [] })
    await flush()

    expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(0)
  })

  it('names every row action after its file and disables them all when disabled', async () => {
    const upload = vi.fn(() => new Promise<void>(() => {}))
    const wrapper = await mountSuspended(MFileUpload, {
      props: { modelValue: [file('contract.pdf')], upload, messages, disabled: true },
    })

    const actions = wrapper.findAll('.ui-file-upload__item-actions button')
    expect(actions.map(action => action.attributes('aria-label'))).toEqual(['Start contract.pdf', 'Remove contract.pdf'])
    for (const action of actions) expect(action.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[role="group"]').attributes('aria-disabled')).toBe('true')
    expect(wrapper.find('.ui-file-upload__dropzone').classes()).toContain('ui-file-upload__dropzone--disabled')
  })

  it('recedes only when disabled: a read-only dropzone keeps its ink', async () => {
    const wrapper = await mountSuspended(MFileUpload, { props: { label: 'Attachments', messages, readonly: true } })

    expect(wrapper.find('[role="group"]').attributes('aria-disabled')).toBeUndefined()
    expect(wrapper.find('.ui-file-upload__dropzone').classes()).not.toContain('ui-file-upload__dropzone--disabled')
    expect(wrapper.find('.ui-file-upload__choose').attributes('disabled')).toBeDefined()
  })

  it('tells status in words and in a glyph, not only in colour', async () => {
    const wrapper = await mountSuspended(MFileUpload, { props: { modelValue: [file('a.txt')], messages } })

    expect(wrapper.find('.ui-file-upload__item-meta').text()).toContain('Queued')
    expect(wrapper.find('.ui-file-upload__item-icon').exists()).toBe(true)
  })

  it('names the failure from what the upload threw', async () => {
    const upload = vi.fn(() => Promise.reject(new Error('413')))
    const wrapper = await mountSuspended(MFileUpload, {
      props: {
        modelValue: [file('big.mov')],
        upload,
        autoStart: true,
        messages: { ...messages, error: (error: unknown) => (error as Error).message === '413' ? 'too large for the server' : undefined },
      },
    })
    await flush()
    await flush()

    expect(wrapper.find('.ui-file-upload__item-meta').text()).toContain('too large for the server')
  })

  it('keeps the long name whole in its title and shortens only the stem', async () => {
    const name = 'a_very_long_file_name_that_will_not_fit_2026_10_07.pdf'
    const wrapper = await mountSuspended(MFileUpload, { props: { modelValue: [file(name)], messages } })

    expect(wrapper.find('.ui-file-upload__item-name').attributes('title')).toBe(name)
    expect(wrapper.find('.ui-file-upload__item-extension').text()).toBe('.pdf')
  })

  it('removes a file that never started without calling it cancelled', async () => {
    const upload = vi.fn(() => new Promise<void>(() => {}))
    const wrapper = await mountSuspended(MFileUpload, { props: { modelValue: [file('a.txt')], upload, messages } })

    await wrapper.find('[aria-label="Remove a.txt"]').trigger('click')
    await flush()

    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeFalsy()
    expect(wrapper.find('.ui-file-upload__status').text()).not.toContain('Cancelled')
  })

  it('keeps the start-all action while rows remain, off when nothing waits', async () => {
    const wrapper = await mountSuspended(MFileUpload, {
      props: { modelValue: [file('a.txt')], upload: () => Promise.resolve(), messages: { ...messages, startAll: 'Start uploads' } },
    })
    const start = () => wrapper.find('.ui-file-upload__start')

    expect(start().attributes('disabled')).toBeUndefined()
    await start().trigger('click')
    await flush()
    await flush()

    expect(start().exists()).toBe(true)
    expect(start().attributes('disabled')).toBeDefined()
  })

  it('takes the statuses from a queue the app keeps, so mounting again sends nothing twice', async () => {
    const upload = vi.fn(() => new Promise<void>(() => {}))
    const scope = effectScope()
    const queue = scope.run(() => useFileUploadQueue({ upload, concurrency: () => 3 }))!
    const props = { modelValue: [file('a.txt')], queue, autoStart: true, messages }

    const first = await mountSuspended(MFileUpload, { props })
    expect(upload).toHaveBeenCalledTimes(1)
    first.unmount()

    const second = await mountSuspended(MFileUpload, { props })
    expect(upload).toHaveBeenCalledTimes(1)
    expect(second.find('.ui-file-upload__item-meta').text()).toContain('Uploading')
    second.unmount()
    scope.stop()
  })

  it('moves focus to the next row when a row is removed', async () => {
    const wrapper = await mountSuspended(MFileUpload, {
      props: { modelValue: [file('a.txt'), file('b.txt')], messages },
      attachTo: document.body,
    })
    const remove = wrapper.find('[aria-label="Remove a.txt"]').element as HTMLButtonElement

    remove.focus()
    remove.click()
    await flush()

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove b.txt')
    wrapper.unmount()
  })
})
