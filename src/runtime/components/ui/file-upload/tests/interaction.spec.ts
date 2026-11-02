import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFileUpload from '../index.vue'
import { useFileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'
import { file, flush, messages, mount, pending, pick, unmount } from './helpers'

afterEach(unmount)

describe('m-file-upload · interaction', () => {
  describe('adding files', () => {
    it('adds a picked file to the model and the queue', async () => {
      const wrapper = await mount({ messages })
      const chosen = file('a.txt')

      await pick(wrapper, [chosen])

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[chosen]])
      expect(wrapper.emitted('add')?.at(-1)).toEqual([[chosen]])
      expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(1)
    })

    it('says why a file was refused and keeps it out of the model', async () => {
      const wrapper = await mount({ accept: 'image/*', messages })

      await pick(wrapper, [file('notes.txt')])

      expect(wrapper.emitted('reject')?.[0]?.[0]).toMatchObject({ reasons: ['type'] })
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('.ui-file-upload__rejection').text()).toBe('notes.txt: type not allowed')
    })

    // Audit: a pick of several refused files said why for the last one only.
    it('says why every refused file of a pick was refused', async () => {
      // `notes.txt` holds four bytes, `photo.png` five.
      const wrapper = await mount({ accept: 'image/*', maxSize: 4, messages })

      await pick(wrapper, [file('notes.txt'), new File(['large'], 'photo.png', { type: 'image/png' })])

      expect(wrapper.find('.ui-file-upload__rejection').text()).toBe('notes.txt: type not allowed; photo.png: too large')
    })

    it('hands every refusal to the rejection slot', async () => {
      const wrapper = await mount({ accept: 'image/*', messages }, {
        slots: { rejection: ({ rejections }: { rejections: Array<{ file: File }> }) => rejections.map(item => item.file.name).join('+') },
      })

      await pick(wrapper, [file('a.txt'), file('b.txt')])

      expect(wrapper.find('.ui-file-upload__rejection').text()).toBe('a.txt+b.txt')
    })

    it('reports a refused file by name even without messages', async () => {
      const wrapper = await mount({ accept: 'image/*' })

      await pick(wrapper, [file('notes.txt')])

      expect(wrapper.find('.ui-file-upload__rejection').text()).toBe('notes.txt')
    })

    it('counts the files already in the model against maxFiles', async () => {
      const wrapper = await mount({ maxFiles: 2, modelValue: [file('a.txt')], messages })

      await pick(wrapper, [file('b.txt'), file('c.txt')])

      expect(wrapper.emitted('reject')?.[0]?.[0]).toMatchObject({ reasons: ['count'] })
      expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(2)
    })

    it('drops the shown refusal once a clean pick is accepted', async () => {
      const wrapper = await mount({ accept: 'text/plain', messages })

      await pick(wrapper, [file('photo.png', 'image/png')])
      expect(wrapper.find('.ui-file-upload__rejection').text()).not.toBe('')

      await pick(wrapper, [file('notes.txt')])
      expect(wrapper.find('.ui-file-upload__rejection').text()).toBe('')
    })

    // Q39-А: one file, as a native single input — the new one takes the place.
    it('replaces the one file of a single upload with a new pick', async () => {
      const first = file('a.txt')
      const second = file('b.txt')
      const wrapper = await mount({ multiple: false, modelValue: [first], messages })

      await pick(wrapper, [second])

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[second]])
      expect(wrapper.emitted('remove')?.at(-1)).toEqual([first])
      expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(1)
    })

    it('stops the upload of the file a new pick replaces', async () => {
      const wrapper = await mount({ multiple: false, modelValue: [file('a.txt')], upload: pending, autoStart: true, messages })

      await pick(wrapper, [file('b.txt')])

      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    it.each(['disabled', 'readonly'] as const)('takes no files while %s', async (state) => {
      const wrapper = await mount({ [state]: true, messages })

      await pick(wrapper, [file('a.txt')])

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('opens the picker from the dropzone button', async () => {
      const wrapper = await mount({ messages })
      const picked = vi.spyOn(wrapper.find('input[type="file"]').element as HTMLInputElement, 'click').mockImplementation(() => {})

      await wrapper.find('.ui-file-upload__choose').trigger('click')

      expect(picked).toHaveBeenCalledTimes(1)
    })
  })

  describe('model', () => {
    it('empties the queue when the model is emptied from outside', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt'), file('b.txt')], messages })
      expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(2)

      await wrapper.setProps({ modelValue: [] })
      await flush()

      expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(0)
    })

    it('adds files written into the model from outside', async () => {
      const wrapper = await mount({ modelValue: [], messages })

      await wrapper.setProps({ modelValue: [file('a.txt')] })
      await flush()

      expect(wrapper.findAll('.ui-file-upload__item')).toHaveLength(1)
    })
  })

  describe('uploading', () => {
    it('starts the files already in the model when auto-start is on', async () => {
      const upload = vi.fn(pending)
      await mount({ modelValue: [file('a.txt')], upload, autoStart: true })

      expect(upload).toHaveBeenCalledTimes(1)
    })

    it('starts a picked file at once with auto-start', async () => {
      const upload = vi.fn(pending)
      const wrapper = await mount({ upload, autoStart: true, messages })

      await pick(wrapper, [file('a.txt')])

      expect(upload).toHaveBeenCalledTimes(1)
    })

    // B7.3d: the upload function is read when a file starts, not once at mount.
    it('uses the upload function the props hold when a file starts', async () => {
      const before = vi.fn(pending)
      const after = vi.fn(pending)
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: before, messages })

      await wrapper.setProps({ upload: after })
      await wrapper.find('.ui-file-upload__action--start').trigger('click')

      expect(before).not.toHaveBeenCalled()
      expect(after).toHaveBeenCalledTimes(1)
    })

    it('waits for a start without auto-start', async () => {
      const upload = vi.fn(pending)
      const wrapper = await mount({ modelValue: [file('a.txt')], upload, messages })

      expect(upload).not.toHaveBeenCalled()
      await wrapper.find('.ui-file-upload__action--start').trigger('click')
      expect(upload).toHaveBeenCalledTimes(1)
    })

    it('names the failure from what the upload threw', async () => {
      const upload = vi.fn(() => Promise.reject(new Error('413')))
      const wrapper = await mount({
        modelValue: [file('big.mov')],
        upload,
        autoStart: true,
        messages: { ...messages, error: (error: unknown) => (error as Error).message === '413' ? 'too large for the server' : undefined },
      })
      await flush()
      await flush()

      expect(wrapper.find('.ui-file-upload__item-meta').text()).toContain('too large for the server')
    })

    it('retries a failed row', async () => {
      const upload = vi.fn().mockRejectedValueOnce(new Error('500')).mockImplementation(pending)
      const wrapper = await mount({ modelValue: [file('a.txt')], upload, autoStart: true, messages })
      await flush()
      await flush()

      await wrapper.find('.ui-file-upload__action--retry').trigger('click')
      await flush()

      expect(upload).toHaveBeenCalledTimes(2)
      expect(wrapper.find('.ui-file-upload__item').classes()).toContain('ui-file-upload__item--uploading')
    })

    it('emits the queue events and complete', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve('ok'), autoStart: true, messages })
      await flush()
      await flush()

      expect(wrapper.emitted('start')).toHaveLength(1)
      expect(wrapper.emitted('success')).toHaveLength(1)
      expect(wrapper.emitted('complete')).toBeTruthy()
    })

    it('keeps the start-all action while rows remain, off when nothing waits', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve(), messages: { ...messages, startAll: 'Start uploads' } })
      const start = () => wrapper.find('.ui-file-upload__start')

      expect(start().attributes('disabled')).toBeUndefined()
      await start().trigger('click')
      await flush()
      await flush()

      expect(start().exists()).toBe(true)
      expect(start().attributes('disabled')).toBeDefined()
    })

    it('takes the statuses from a queue the app keeps, so mounting again sends nothing twice', async () => {
      const upload = vi.fn(pending)
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
  })

  describe('removing', () => {
    it('removes a file that never started without calling it cancelled', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: pending, messages })

      await wrapper.find('[aria-label="Remove a.txt"]').trigger('click')
      await flush()

      expect(wrapper.emitted('remove')).toHaveLength(1)
      expect(wrapper.emitted('cancel')).toBeFalsy()
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
      expect(wrapper.find('.ui-file-upload__status').text()).not.toContain('Cancelled')
    })

    it('does not remove a row while it uploads', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: pending, autoStart: true, messages })

      expect(wrapper.find('[aria-label="Remove a.txt"]').attributes('disabled')).toBeDefined()
    })

    it('moves focus to the next row when a row is removed', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt'), file('b.txt')], messages }, { attach: true })
      const remove = wrapper.find('[aria-label="Remove a.txt"]').element as HTMLButtonElement

      remove.focus()
      remove.click()
      await flush()

      expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove b.txt')
    })
  })
})
