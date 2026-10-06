import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MOtpInput from '../index.vue'

let current: { unmount: () => void } | null = null

// Attached on purpose: `focusAt` calls `element.focus()`, and jsdom fires no
// focus event for a node that is not in the document.
async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MOtpInput, { props, attachTo: document.body })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

function last(wrapper: { emitted: (name: string) => unknown[][] | undefined }, event: string) {
  return wrapper.emitted(event)?.at(-1)
}

/** Lays the cells out 48 wide on a 50 pitch, which jsdom does not do by itself. */
function layOutCells(wrapper: { findAll: (selector: string) => Array<{ element: Element }> }) {
  wrapper.findAll('.ui-otp-input__field').forEach(({ element }, index) => {
    element.getBoundingClientRect = () => ({ left: index * 50, right: index * 50 + 48 }) as DOMRect
  })
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-otp-input · interaction', () => {
  describe('accepting characters', () => {
    it('takes a typed code', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').setValue('1234')

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
    })

    it('accepts a paste and truncates it to the length', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').setValue('123456789')

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
    })

    it('drops the characters the alphabet does not allow, and says which', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').setValue('12-34')

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
      expect(last(wrapper, 'invalid')).toEqual(['12-34', ['-']])
    })

    it('rejects letters in numeric mode and keeps them in alphanumeric', async () => {
      const numeric = await mount({ length: 4 })
      await numeric.find('input').setValue('12ab')
      expect(last(numeric, 'update:modelValue')).toEqual(['12'])

      const alphanumeric = await mount({ length: 4, mode: 'alphanumeric' })
      await alphanumeric.find('input').setValue('12ab')
      expect(last(alphanumeric, 'update:modelValue')).toEqual(['12ab'])
    })

    it('normalizes Arabic-Indic digits — a code pasted from an SMS still works', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').setValue('١٢٣٤')

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
    })

    it('normalizes Extended Arabic-Indic digits too', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').setValue('۱۲۳۴')

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
    })

    it('normalizes full-width digits through NFKC', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').setValue('１２３４')

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
    })

    it('rewrites the DOM value, so a rejected character never lingers on screen', async () => {
      const wrapper = await mount({ length: 4 })
      const input = wrapper.find('input')

      await input.setValue('1x2')

      expect(input.element.value).toBe('12')
    })
  })

  describe('completion', () => {
    it('announces completion exactly once', async () => {
      const wrapper = await mount({ length: 4 })
      const input = wrapper.find('input')

      await input.setValue('123')
      expect(wrapper.emitted('complete')).toBeUndefined()

      await input.setValue('1234')
      expect(wrapper.emitted('complete')).toEqual([['1234']])

      await input.setValue('1234')
      expect(wrapper.emitted('complete')).toEqual([['1234']])
    })

    it('announces a clear only after there was something to clear', async () => {
      const wrapper = await mount({ length: 4 })
      const input = wrapper.find('input')

      await input.setValue('')
      expect(wrapper.emitted('clear')).toBeUndefined()

      await input.setValue('12')
      await input.setValue('')
      expect(wrapper.emitted('clear')).toHaveLength(1)
    })
  })

  describe('composition', () => {
    it('holds the model still until the composition ends', async () => {
      const wrapper = await mount({ length: 4 })
      const input = wrapper.find('input')

      await input.trigger('compositionstart')
      await input.setValue('12')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      await input.trigger('compositionend')
      expect(last(wrapper, 'update:modelValue')).toEqual(['12'])
    })
  })

  describe('caret', () => {
    it('follows a click on a cell', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12' })

      await wrapper.findAll('.ui-otp-input__field')[2]!.trigger('click')

      expect(wrapper.findAll('.ui-otp-input__field')[2]!.classes())
        .toContain('ui-otp-input__field--active')
    })

    // In a browser the transparent input lies over the grid and takes the click;
    // its own caret would land wherever the invisible text reaches.
    it('puts the caret on the cell drawn under a click on the input', async () => {
      const wrapper = await mount({ length: 4, modelValue: '1234' })
      layOutCells(wrapper)

      await wrapper.find('input').trigger('click', { clientX: 120 })

      expect((wrapper.find('input').element as HTMLInputElement).selectionStart).toBe(2)
      expect(wrapper.findAll('.ui-otp-input__field')[2]!.classes()).toContain('ui-otp-input__field--active')
    })

    it('stops at the end of the typed text when the click lands further on', async () => {
      const wrapper = await mount({ length: 4, modelValue: '1' })
      layOutCells(wrapper)

      await wrapper.find('input').trigger('click', { clientX: 170 })

      expect(wrapper.findAll('.ui-otp-input__field')[1]!.classes()).toContain('ui-otp-input__field--active')
    })

    it('ignores a click on a cell while the field is disabled', async () => {
      const wrapper = await mount({ length: 4, disabled: true })

      await wrapper.findAll('.ui-otp-input__field')[2]!.trigger('click')

      expect(wrapper.find('.ui-otp-input__field--active').exists()).toBe(false)
    })

    it('highlights nothing once the caret sits past the last cell', async () => {
      const wrapper = await mount({ length: 3 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('123')

      expect(wrapper.find('.ui-otp-input__field--active').exists()).toBe(false)
    })

    it('lights the last cell when the caret steps back into it', async () => {
      const wrapper = await mount({ length: 3 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('123')

      input.element.setSelectionRange(2, 2)
      document.dispatchEvent(new Event('selectionchange'))
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.ui-otp-input__field')[2]!.classes())
        .toContain('ui-otp-input__field--active')
    })

    it('tracks every caret move, not only the ones that end a keypress', async () => {
      const wrapper = await mount({ length: 4, modelValue: '1234' })
      const input = wrapper.find('input')

      await input.trigger('focus')

      for (const position of [3, 2, 1]) {
        input.element.setSelectionRange(position, position)
        document.dispatchEvent(new Event('selectionchange'))
        await wrapper.vm.$nextTick()

        expect(wrapper.findAll('.ui-otp-input__field')[position]!.classes())
          .toContain('ui-otp-input__field--active')
      }
    })

    it('stops following the caret once the field loses focus', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12' })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.trigger('blur')

      input.element.setSelectionRange(0, 0)
      document.dispatchEvent(new Event('selectionchange'))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ui-otp-input__field--active').exists()).toBe(false)
    })
  })

  describe('fallthrough listeners', () => {
    it('reach the input alongside the own handlers of the field', async () => {
      const calls: string[] = []
      const wrapper = await mountSuspended(MOtpInput, {
        props: { length: 4 },
        attrs: {
          onFocus: () => calls.push('focus'),
          onBlur: () => calls.push('blur'),
          onInput: () => calls.push('input'),
        },
        attachTo: document.body,
      })
      current = wrapper
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('12')
      await input.trigger('blur')

      expect(calls).toEqual(['focus', 'input', 'blur'])
      expect(last(wrapper, 'update:modelValue')).toEqual(['12'])
    })
  })

  describe('length changes', () => {
    it('truncates a value that no longer fits', async () => {
      const wrapper = await mount({ length: 6, modelValue: '123456' })

      await wrapper.setProps({ length: 4 })

      expect(last(wrapper, 'update:modelValue')).toEqual(['1234'])
    })

    it('leaves a value that still fits alone', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12' })

      await wrapper.setProps({ length: 6 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })
})
