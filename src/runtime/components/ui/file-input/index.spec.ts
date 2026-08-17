import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFileInput from './index.vue'

function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { configurable: true, value: files })
}

describe('m-file-input', () => {
  it('selects a File model and renders its name', async () => {
    const wrapper = await mountSuspended(MFileInput)
    const native = wrapper.find('input[type="file"]')
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

    setFiles(native.element as HTMLInputElement, [file])
    await native.trigger('change')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([file])
    expect(wrapper.find('input.ui-text-field__input').element.value).toBe('hello.txt')
  })

  it('supports multiple files and clear', async () => {
    const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]
    const wrapper = await mountSuspended(MFileInput, { props: { multiple: true, modelValue: files } })

    expect(wrapper.find('input.ui-text-field__input').element.value).toBe('a.txt, b.txt')
    await wrapper.find('[aria-label="Clear selected files"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('rejects files outside the policy', async () => {
    const wrapper = await mountSuspended(MFileInput, { props: { accept: 'image/*', maxSize: 3 } })
    const native = wrapper.find('input[type="file"]')
    const file = new File(['large'], 'note.txt', { type: 'text/plain' })

    setFiles(native.element as HTMLInputElement, [file])
    await native.trigger('change')

    expect(wrapper.emitted('reject')?.[0]?.[0]).toMatchObject({ file, reasons: ['type', 'size'] })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('blocks browse and clear while readonly', async () => {
    const file = new File(['a'], 'a.txt')
    const wrapper = await mountSuspended(MFileInput, { props: { readonly: true, modelValue: file } })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Clear selected files"]').attributes('disabled')).toBeDefined()
  })
})
