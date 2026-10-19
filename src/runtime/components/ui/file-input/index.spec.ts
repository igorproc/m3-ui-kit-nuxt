import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFileInput from './index.vue'

function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { configurable: true, value: files })
}

const field = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
  wrapper.find('input.ui-text-field__input').element as HTMLInputElement

describe('m-file-input', () => {
  it('selects a File model and renders its name', async () => {
    const wrapper = await mountSuspended(MFileInput)
    const native = wrapper.find('input[type="file"]')
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

    setFiles(native.element as HTMLInputElement, [file])
    await native.trigger('change')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([file])
    expect(field(wrapper).value).toBe('hello.txt')
  })

  it('supports multiple files and a named clear', async () => {
    const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]
    const wrapper = await mountSuspended(MFileInput, { props: { multiple: true, modelValue: files, clearLabel: 'Remove files' } })

    expect(field(wrapper).value).toBe('a.txt, b.txt')
    await wrapper.find('[aria-label="Remove files"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('summarises a long selection with names and a count, no phrase', async () => {
    const files = ['a', 'b', 'c', 'd', 'e'].map(name => new File([name], `${name}.txt`))
    const wrapper = await mountSuspended(MFileInput, { props: { multiple: true, modelValue: files } })

    expect(field(wrapper).value).toBe('a.txt, b.txt, c.txt +2')
  })

  it('rejects files outside the policy and says why in the support line', async () => {
    const wrapper = await mountSuspended(MFileInput, {
      props: { accept: 'image/*', maxSize: 3, rejectMessages: { type: 'not an image', size: 'over 3 B' } },
    })
    const native = wrapper.find('input[type="file"]')
    const file = new File(['large'], 'note.txt', { type: 'text/plain' })

    setFiles(native.element as HTMLInputElement, [file])
    await native.trigger('change')

    expect(wrapper.emitted('reject')?.[0]?.[0]).toMatchObject({ file, reasons: ['type', 'size'] })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').text()).toBe('note.txt: not an image, over 3 B')
    expect(wrapper.find('input.ui-text-field__input').attributes('aria-invalid')).toBe('true')
  })

  it('reports a refused file by name even without messages', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { accept: 'image/*' } })
    const native = wrapper.find('input[type="file"]')

    setFiles(native.element as HTMLInputElement, [new File(['x'], 'note.txt', { type: 'text/plain' })])
    await native.trigger('change')

    expect(wrapper.find('[role="alert"]').text()).toBe('note.txt')
  })

  it('clears a refusal once a file is accepted', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { accept: 'text/plain' } })
    const native = wrapper.find('input[type="file"]')

    setFiles(native.element as HTMLInputElement, [new File(['x'], 'photo.png', { type: 'image/png' })])
    await native.trigger('change')
    expect(wrapper.find('[role="alert"]').text()).not.toBe('')

    setFiles(native.element as HTMLInputElement, [new File(['x'], 'note.txt', { type: 'text/plain' })])
    await native.trigger('change')
    // With no error bound by the consumer the line lives only while there is a
    // refusal to show (support-line decision 2026-10-19).
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('opens the picker from the field itself: a press, Enter or Space', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { browseLabel: 'Browse' } })
    const native = wrapper.find('input[type="file"]').element as HTMLInputElement
    const picked = vi.spyOn(native, 'click').mockImplementation(() => {})

    await wrapper.find('input.ui-text-field__input').trigger('click')
    await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'Enter' })
    await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: ' ' })
    await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'a' })

    expect(picked).toHaveBeenCalledTimes(3)
  })

  it('does not open the picker from a read-only field', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { readonly: true } })
    const native = wrapper.find('input[type="file"]').element as HTMLInputElement
    const picked = vi.spyOn(native, 'click').mockImplementation(() => {})

    await wrapper.find('input.ui-text-field__input').trigger('click')
    expect(picked).not.toHaveBeenCalled()
  })

  it('formats the size with the formatter of the app', async () => {
    const wrapper = await mountSuspended(MFileInput, {
      props: { showSize: true, modelValue: new File(['abc'], 'a.txt'), formatSize: (bytes: number) => `${bytes} байт` },
    })

    expect(field(wrapper).value).toBe('a.txt (3 байт)')
  })

  it('blocks browse and clear while readonly', async () => {
    const file = new File(['a'], 'a.txt')
    const wrapper = await mountSuspended(MFileInput, {
      props: { readonly: true, modelValue: file, browseLabel: 'Browse', clearLabel: 'Remove' },
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Remove"]').attributes('disabled')).toBeDefined()
  })

  it('names the browse button with its text and describes it by the field label', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { label: 'Attachments', browseLabel: 'Browse' } })
    const browse = wrapper.find('button')
    const description = browse.attributes('aria-describedby')!

    expect(browse.text()).toBe('Browse')
    expect(wrapper.find(`[id="${description}"]`).text()).toBe('Attachments')
  })

  it('falls back to an icon button named after the field without a browse label', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { label: 'Attachments' } })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Attachments')
  })

  it('forwards the field axes and required to the visible field', async () => {
    const wrapper = await mountSuspended(MFileInput, {
      props: { label: 'Attachments', variant: 'outlined', shape: 'large', labelPlacement: 'top', density: 'compact', required: true },
    })
    const root = wrapper.find('.ui-text-field')

    expect(root.classes()).toEqual(expect.arrayContaining([
      'ui-text-field--outlined',
      'ui-text-field--shape-large',
      'ui-text-field--label-top',
      'ui-text-field--density-compact',
    ]))
    expect(wrapper.find('input.ui-text-field__input').attributes('aria-required')).toBe('true')
    expect(wrapper.find('input[type="file"]').attributes('required')).toBeDefined()
  })

  it('sends attributes to the field input and keeps class on the root', async () => {
    const wrapper = await mountSuspended(MFileInput, { attrs: { 'class': 'consumer', 'aria-describedby': 'hint' } })

    expect(wrapper.classes()).toContain('consumer')
    expect(wrapper.find('input.ui-text-field__input').attributes('aria-describedby')).toBe('hint')
  })
})
