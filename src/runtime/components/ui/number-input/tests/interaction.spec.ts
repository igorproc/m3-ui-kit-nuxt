import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MNumberInput from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MNumberInput, { props })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

/** Latest payload of a single-argument emit, or `undefined` when never emitted. */
function last(wrapper: { emitted: (name: string) => unknown[][] | undefined }, event: string) {
  return wrapper.emitted(event)?.at(-1)
}

function dragTo(from: number, to: number) {
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: to, clientY: 0 }))
  return to - from
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-number-input · interaction', () => {
  describe('typing', () => {
    it('keeps an incomplete draft visible instead of rewriting it', async () => {
      const wrapper = await mount({ modelValue: 12 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('-')

      expect(input.element.value).toBe('-')
      expect(last(wrapper, 'update:modelValue')).not.toEqual([Number.NaN])
    })

    it('follows the draft keystroke by keystroke once it parses', async () => {
      const wrapper = await mount({ modelValue: 1 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('42')

      expect(last(wrapper, 'update:modelValue')).toEqual([42])
    })

    it('never clamps mid-typing — 1 on the way to 100 stays 1', async () => {
      const wrapper = await mount({ modelValue: 100, min: 10, max: 1000 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('1')

      expect(input.element.value).toBe('1')
      expect(last(wrapper, 'update:modelValue')).toEqual([1])
    })

    it('clamps on blur, and reports the pull-back as out-of-range', async () => {
      const wrapper = await mount({ modelValue: 1, min: 0, max: 10 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('12')
      await input.trigger('blur')

      expect(last(wrapper, 'update:modelValue')).toEqual([10])
      expect(last(wrapper, 'invalid')).toEqual(['12', 'out-of-range'])
    })

    it('leaves the value alone on blur when clamping is off', async () => {
      const wrapper = await mount({ modelValue: 1, min: 0, max: 10, clamp: false })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('12')
      await input.trigger('blur')

      expect(last(wrapper, 'update:modelValue')).toEqual([12])
      expect(wrapper.emitted('invalid')).toBeUndefined()
    })

    it('parses a locale draft with its own decimal separator', async () => {
      const wrapper = await mount({ locale: 'de-DE', modelValue: 1, precision: 1 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('12,5')
      await input.trigger('blur')

      expect(last(wrapper, 'update:modelValue')).toEqual([12.5])
    })

    it('clears to null on an empty draft rather than rejecting it', async () => {
      const wrapper = await mount({ modelValue: 3 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('')
      await input.trigger('blur')

      expect(last(wrapper, 'update:modelValue')).toEqual([null])
      expect(wrapper.emitted('invalid')).toBeUndefined()
    })

    it('restores the last good value when the draft cannot be parsed', async () => {
      const wrapper = await mount({ modelValue: 3 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('nonsense')
      await input.trigger('blur')

      expect(last(wrapper, 'invalid')).toEqual(['nonsense', 'invalid'])
      expect(input.element.value).toBe('3')
    })

    it('holds the model still while a composition is in flight', async () => {
      const wrapper = await mount({ modelValue: 1 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.trigger('compositionstart')
      await input.setValue('7')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      await input.trigger('compositionend')
      expect(last(wrapper, 'update:modelValue')).toEqual([7])
    })

    it('drops grouping while editing and puts it back on blur', async () => {
      const wrapper = await mount({ modelValue: 12345 })
      const input = wrapper.find('input')

      expect(input.element.value).toBe('12,345')

      await input.trigger('focus')
      expect(input.element.value).toBe('12345')

      await input.trigger('blur')
      expect(input.element.value).toBe('12,345')
    })
  })

  describe('stepping', () => {
    it('steps up and down from the controls', async () => {
      const wrapper = await mount({ modelValue: 3 })

      await wrapper.find('.ui-number-input__stepper--increment').trigger('click')
      expect(last(wrapper, 'update:modelValue')).toEqual([4])
      expect(last(wrapper, 'increment')).toEqual([4])

      await wrapper.find('.ui-number-input__stepper--decrement').trigger('click')
      expect(last(wrapper, 'update:modelValue')).toEqual([3])
      expect(last(wrapper, 'decrement')).toEqual([3])
    })

    it('avoids decimal drift on fractional steps', async () => {
      const wrapper = await mount({ modelValue: 0.1, step: 0.1, precision: 1 })

      await wrapper.find('.ui-number-input__stepper--increment').trigger('click')

      expect(last(wrapper, 'update:modelValue')).toEqual([0.2])
    })

    it('anchors an empty field to the lower bound before stepping', async () => {
      const wrapper = await mount({ modelValue: null, min: 5 })

      await wrapper.find('.ui-number-input__stepper--increment').trigger('click')

      expect(last(wrapper, 'update:modelValue')).toEqual([6])
    })

    it('disables the control that would leave the range', async () => {
      const wrapper = await mount({ modelValue: 10, min: 0, max: 10 })

      expect(wrapper.find('.ui-number-input__stepper--increment').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.ui-number-input__stepper--decrement').attributes('disabled')).toBeUndefined()
    })

    it('treats a zero or negative step as one, so the field never freezes', async () => {
      const wrapper = await mount({ modelValue: 3, step: 0 })

      await wrapper.find('.ui-number-input__stepper--increment').trigger('click')

      expect(last(wrapper, 'update:modelValue')).toEqual([4])
    })

    it('refuses to step a disabled or read-only field', async () => {
      const disabled = await mount({ modelValue: 3, disabled: true })
      await disabled.find('.ui-number-input__stepper--increment').trigger('click')
      expect(disabled.emitted('update:modelValue')).toBeUndefined()

      const readonly = await mount({ modelValue: 3, readonly: true })
      await readonly.find('input').trigger('keydown', { key: 'ArrowUp' })
      expect(readonly.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('keyboard', () => {
    it('steps with the arrow keys', async () => {
      const wrapper = await mount({ modelValue: 5 })
      const input = wrapper.find('input')

      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(last(wrapper, 'update:modelValue')).toEqual([6])

      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(last(wrapper, 'update:modelValue')).toEqual([5])
    })

    it('jumps ten steps with PageUp and PageDown', async () => {
      const wrapper = await mount({ modelValue: 5 })

      await wrapper.find('input').trigger('keydown', { key: 'PageUp' })

      expect(last(wrapper, 'update:modelValue')).toEqual([15])
    })

    it('sends Home and End to the bounds', async () => {
      const wrapper = await mount({ modelValue: 5, min: 1, max: 9 })
      const input = wrapper.find('input')

      await input.trigger('keydown', { key: 'Home' })
      expect(last(wrapper, 'update:modelValue')).toEqual([1])

      await input.trigger('keydown', { key: 'End' })
      expect(last(wrapper, 'update:modelValue')).toEqual([9])
    })

    it('leaves Home and End to the caret when there is no bound to jump to', async () => {
      const wrapper = await mount({ modelValue: 5 })

      await wrapper.find('input').trigger('keydown', { key: 'Home' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('commits on Enter', async () => {
      const wrapper = await mount({ modelValue: 3, min: 0, max: 10 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('99')
      await input.trigger('keydown', { key: 'Enter' })

      expect(last(wrapper, 'update:modelValue')).toEqual([10])
      expect(input.element.value).toBe('10')
    })

    it('rolls back to the last committed value on Escape, not to the live model', async () => {
      const wrapper = await mount({ modelValue: 3 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('7')
      await input.trigger('keydown', { key: 'Escape' })

      expect(input.element.value).toBe('3')
      expect(last(wrapper, 'update:modelValue')).toEqual([3])
    })

    it('takes a committed step as the new Escape target', async () => {
      const wrapper = await mount({ modelValue: 3 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.trigger('keydown', { key: 'ArrowUp' })
      await input.setValue('99')
      await input.trigger('keydown', { key: 'Escape' })

      expect(input.element.value).toBe('4')
    })
  })

  describe('scrub', () => {
    it('turns horizontal travel into steps', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 240 })

      await wrapper.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 100, clientY: 0 })
      dragTo(100, 140)
      await wrapper.vm.$nextTick()

      expect(last(wrapper, 'update:modelValue')).toEqual([250])
    })

    it('is absolute, so dragging back restores the value it started from', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 240 })

      await wrapper.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 100, clientY: 0 })
      dragTo(100, 140)
      dragTo(100, 100)
      await wrapper.vm.$nextTick()

      expect(last(wrapper, 'update:modelValue')).toEqual([240])
    })

    it('coarsens with Shift and refines with Alt', async () => {
      const coarse = await mount({ controls: 'scrub', label: 'W', modelValue: 0 })
      await coarse.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 0, clientY: 0 })
      window.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 0, shiftKey: true }))
      await coarse.vm.$nextTick()
      expect(last(coarse, 'update:modelValue')).toEqual([100])

      const fine = await mount({ controls: 'scrub', label: 'W', modelValue: 0, step: 1, precision: 1 })
      await fine.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 0, clientY: 0 })
      window.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 0, altKey: true }))
      await fine.vm.$nextTick()
      expect(last(fine, 'update:modelValue')).toEqual([1])
    })

    it('respects the range while dragging', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 8, max: 10 })

      await wrapper.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 0, clientY: 0 })
      dragTo(0, 400)
      await wrapper.vm.$nextTick()

      expect(last(wrapper, 'update:modelValue')).toEqual([10])
    })

    it('ignores the gesture when the field cannot be edited', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 240, disabled: true })

      await wrapper.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 100, clientY: 0 })
      dragTo(100, 140)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('does not move the value below the drag threshold — a click stays a click', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 240 })

      await wrapper.find('.ui-number-input__scrub').trigger('pointerdown', { clientX: 100, clientY: 0 })
      dragTo(100, 102)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('external writes', () => {
    it('re-renders the draft when the model changes from outside', async () => {
      const wrapper = await mount({ modelValue: 1 })

      await wrapper.setProps({ modelValue: 9 })

      expect(wrapper.find('input').element.value).toBe('9')
    })

    it('reformats when the locale changes under a settled value', async () => {
      const wrapper = await mount({ modelValue: 12345 })
      expect(wrapper.find('input').element.value).toBe('12,345')

      await wrapper.setProps({ locale: 'de-DE' })

      expect(wrapper.find('input').element.value).toBe('12.345')
    })
  })
})
