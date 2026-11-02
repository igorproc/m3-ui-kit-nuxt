import { afterEach, describe, expect, it, vi } from 'vitest'
import { field, mount, native, pick, unmount } from './helpers'

afterEach(unmount)

const text = (wrapper: Awaited<ReturnType<typeof mount>>) => (field(wrapper).element as HTMLInputElement).value

describe('m-file-input · interaction', () => {
  describe('choosing', () => {
    it('selects a File model and renders its name', async () => {
      const wrapper = await mount()
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

      await pick(wrapper, [file])

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([file])
      expect(wrapper.emitted('select')?.at(-1)).toEqual([[file]])
      expect(text(wrapper)).toBe('hello.txt')
    })

    it('writes an array model with multiple', async () => {
      const wrapper = await mount({ multiple: true })
      const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]

      await pick(wrapper, files)

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([files])
    })

    it('keeps the first file only without multiple', async () => {
      const wrapper = await mount()
      const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]

      await pick(wrapper, files)

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([files[0]])
    })

    it('rejects files outside the policy and says why in the support line', async () => {
      const wrapper = await mount({ accept: 'image/*', maxSize: 3, rejectMessages: { type: 'not an image', size: 'over 3 B' } })
      const file = new File(['large'], 'note.txt', { type: 'text/plain' })

      await pick(wrapper, [file])

      expect(wrapper.emitted('reject')?.[0]?.[0]).toMatchObject({ file, reasons: ['type', 'size'] })
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('[role="alert"]').text()).toBe('note.txt: not an image, over 3 B')
    })

    // Audit: a pick of several refused files said why for the first one only.
    it('says why every refused file of a pick was refused', async () => {
      const wrapper = await mount({ multiple: true, accept: 'image/*', maxSize: 3, rejectMessages: { type: 'not an image', size: 'over 3 B' } })

      await pick(wrapper, [new File(['x'], 'note.txt', { type: 'text/plain' }), new File(['large'], 'photo.png', { type: 'image/png' })])

      expect(wrapper.find('[role="alert"]').text()).toBe('note.txt: not an image; photo.png: over 3 B')
    })

    it('reports a refused file by name even without messages', async () => {
      const wrapper = await mount({ accept: 'image/*' })

      await pick(wrapper, [new File(['x'], 'note.txt', { type: 'text/plain' })])

      expect(wrapper.find('[role="alert"]').text()).toBe('note.txt')
    })

    it('refuses files past maxFiles with the count reason', async () => {
      const wrapper = await mount({ multiple: true, maxFiles: 1 })
      const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]

      await pick(wrapper, files)

      expect(wrapper.emitted('reject')?.[0]?.[0]).toMatchObject({ file: files[1], reasons: ['count'] })
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[files[0]]])
    })

    it('clears a refusal once a file is accepted', async () => {
      const wrapper = await mount({ accept: 'text/plain' })

      await pick(wrapper, [new File(['x'], 'photo.png', { type: 'image/png' })])
      expect(wrapper.find('[role="alert"]').text()).not.toBe('')

      await pick(wrapper, [new File(['x'], 'note.txt', { type: 'text/plain' })])
      // With no error bound by the consumer the line lives only while there is a
      // refusal to show (support-line decision 2026-10-19).
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  describe('clear', () => {
    it('empties a multiple model to an array and emits clear', async () => {
      const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]
      const wrapper = await mount({ multiple: true, modelValue: files, clearLabel: 'Remove files' })

      await wrapper.find('[aria-label="Remove files"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
      expect(wrapper.emitted('clear')).toHaveLength(1)
    })

    it('empties a single model to null', async () => {
      const wrapper = await mount({ modelValue: new File(['a'], 'a.txt'), clearLabel: 'Remove' })

      await wrapper.find('[aria-label="Remove"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    })

    // B7.3a: the clear button goes with the files; the focus must not fall to the page.
    it('puts the focus in the field when the clear button takes itself away', async () => {
      const wrapper = await mount({ modelValue: new File(['a'], 'a.txt'), clearLabel: 'Remove' }, { attach: true })
      const clear = wrapper.find('[aria-label="Remove"]')

      ;(clear.element as HTMLElement).focus()
      await clear.trigger('click')
      await wrapper.vm.$nextTick()

      expect(document.activeElement).toBe(field(wrapper).element)
    })

    it('drops a shown refusal', async () => {
      const wrapper = await mount({ accept: 'image/*' })
      await pick(wrapper, [new File(['x'], 'note.txt', { type: 'text/plain' })])

      ;(wrapper.vm as unknown as { clear: () => void }).clear()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  describe('opening the picker', () => {
    it('opens the picker from the field itself: a press, Enter or Space', async () => {
      const wrapper = await mount({ browseLabel: 'Browse' })
      const picked = vi.spyOn(native(wrapper).element as HTMLInputElement, 'click').mockImplementation(() => {})

      await field(wrapper).trigger('click')
      await field(wrapper).trigger('keydown', { key: 'Enter' })
      await field(wrapper).trigger('keydown', { key: ' ' })
      await field(wrapper).trigger('keydown', { key: 'a' })

      expect(picked).toHaveBeenCalledTimes(3)
    })

    it('opens the picker from the browse button', async () => {
      const wrapper = await mount({ browseLabel: 'Browse' })
      const picked = vi.spyOn(native(wrapper).element as HTMLInputElement, 'click').mockImplementation(() => {})

      await wrapper.find('.ui-file-input__actions button').trigger('click')

      expect(picked).toHaveBeenCalledTimes(1)
    })

    it.each(['readonly', 'disabled'] as const)('does not open the picker from a %s field', async (state) => {
      const wrapper = await mount({ [state]: true })
      const picked = vi.spyOn(native(wrapper).element as HTMLInputElement, 'click').mockImplementation(() => {})

      await field(wrapper).trigger('click')
      ;(wrapper.vm as unknown as { open: () => void }).open()

      expect(picked).not.toHaveBeenCalled()
    })
  })

  describe('disabled and read-only', () => {
    it('blocks browse and clear while readonly', async () => {
      const wrapper = await mount({ readonly: true, modelValue: new File(['a'], 'a.txt'), browseLabel: 'Browse', clearLabel: 'Remove' })

      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[aria-label="Remove"]').attributes('disabled')).toBeDefined()
    })

    it('disables the native input, so the form does not submit it', async () => {
      const wrapper = await mount({ disabled: true })

      expect(native(wrapper).attributes('disabled')).toBeDefined()
    })

    it('keeps the model through a clear while readonly', async () => {
      const wrapper = await mount({ readonly: true, modelValue: new File(['a'], 'a.txt') })

      ;(wrapper.vm as unknown as { clear: () => void }).clear()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('focus', () => {
    it('reports focus while the browse button holds it', async () => {
      const wrapper = await mount({ browseLabel: 'Browse' })

      await wrapper.find('.ui-file-input__actions button').trigger('focus')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([true])

      await wrapper.find('.ui-file-input__actions button').trigger('blur')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([false])
    })
  })

  describe('attributes', () => {
    it('sends attributes to the field input and keeps class on the root', async () => {
      const wrapper = await mount({}, { attrs: { 'class': 'consumer', 'aria-describedby': 'hint' } })

      expect(wrapper.classes()).toContain('consumer')
      expect(field(wrapper).attributes('aria-describedby')).toBe('hint')
    })
  })
})
