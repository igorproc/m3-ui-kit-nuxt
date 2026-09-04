import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h, nextTick } from 'vue'
import MTextarea from '../index.vue'

/** jsdom reports no layout, so the composable falls back to this row height. */
const ROW = 24

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTextarea, { props, slots, attachTo: document.body })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

function heightOf(wrapper: Awaited<ReturnType<typeof mount>>) {
  const style = wrapper.find('textarea').attributes('style') ?? ''
  const match = style.match(/height:\s*(\d+(?:\.\d+)?)px/)

  return match ? Number.parseFloat(match[1]!) : null
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-textarea · interaction', () => {
  describe('model', () => {
    it('writes through to the model on input', async () => {
      const wrapper = await mount({ rows: 4 })
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Multiline')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Multiline'])
    })

    it('marks itself populated once the value is not empty', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-textarea--populated')
      await wrapper.find('textarea').setValue('x')
      expect(wrapper.classes()).toContain('ui-textarea--populated')
    })
  })

  describe('focus', () => {
    it('tracks focus on the root class and on the focused model', async () => {
      const wrapper = await mount()
      const textarea = wrapper.find('textarea')

      await textarea.trigger('focus')
      expect(wrapper.classes()).toContain('ui-textarea--focused')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([true])

      await textarea.trigger('blur')
      expect(wrapper.classes()).not.toContain('ui-textarea--focused')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([false])
    })

    it('focuses the control when the surrounding box is pressed', async () => {
      const wrapper = await mount()

      await wrapper.find('.ui-textarea__body').trigger('pointerdown')

      expect(document.activeElement).toBe(wrapper.find('textarea').element)
    })

    it('leaves a press on an adornment control alone', async () => {
      const wrapper = await mount({}, { append: () => h('button', { type: 'button' }, 'clear') })

      await wrapper.find('button').trigger('pointerdown')

      expect(document.activeElement).not.toBe(wrapper.find('textarea').element)
    })
  })

  describe('resize grip', () => {
    it('grows and shrinks by one row per arrow key', async () => {
      const wrapper = await mount({ resizable: true, rows: 3 })
      const grip = wrapper.find('.ui-textarea__grip')

      await grip.trigger('keydown', { key: 'ArrowDown' })
      expect(heightOf(wrapper)).toBe(4 * ROW)

      await grip.trigger('keydown', { key: 'ArrowUp' })
      expect(heightOf(wrapper)).toBe(3 * ROW)
    })

    it('steps five rows at a time with Page keys', async () => {
      const wrapper = await mount({ resizable: true, rows: 3 })

      await wrapper.find('.ui-textarea__grip').trigger('keydown', { key: 'PageDown' })

      expect(heightOf(wrapper)).toBe(8 * ROW)
    })

    it('never shrinks below rows or grows past maxRows', async () => {
      const wrapper = await mount({ resizable: true, rows: 3, maxRows: 5 })
      const grip = wrapper.find('.ui-textarea__grip')

      await grip.trigger('keydown', { key: 'PageUp' })
      expect(heightOf(wrapper)).toBe(3 * ROW)

      await grip.trigger('keydown', { key: 'End' })
      expect(heightOf(wrapper)).toBe(5 * ROW)

      await grip.trigger('keydown', { key: 'PageDown' })
      expect(heightOf(wrapper)).toBe(5 * ROW)

      await grip.trigger('keydown', { key: 'Home' })
      expect(heightOf(wrapper)).toBe(3 * ROW)
    })

    it('hands the box back to automatic sizing on Escape', async () => {
      const wrapper = await mount({ resizable: true, rows: 3 })
      const grip = wrapper.find('.ui-textarea__grip')

      await grip.trigger('keydown', { key: 'ArrowDown' })
      expect(heightOf(wrapper)).not.toBeNull()

      await grip.trigger('keydown', { key: 'Escape' })
      expect(heightOf(wrapper)).toBeNull()
    })

    it('ignores keys it does not own', async () => {
      const wrapper = await mount({ resizable: true })

      await wrapper.find('.ui-textarea__grip').trigger('keydown', { key: 'a' })

      expect(heightOf(wrapper)).toBeNull()
    })

    it('sets the height by pointer drag and flags the drag while it lasts', async () => {
      const wrapper = await mount({ resizable: true, rows: 3 })

      await wrapper.find('.ui-textarea__grip').trigger('pointerdown', { button: 0, clientY: 0 })
      expect(wrapper.classes()).toContain('ui-textarea--resizing')

      document.dispatchEvent(new MouseEvent('pointermove', { clientY: 200 }))
      await nextTick()
      expect(heightOf(wrapper)).toBe(200)

      document.dispatchEvent(new MouseEvent('pointerup'))
      await nextTick()
      expect(wrapper.classes()).not.toContain('ui-textarea--resizing')
    })

    it('stops tracking the pointer after the drag ends', async () => {
      const wrapper = await mount({ resizable: true, rows: 3 })

      await wrapper.find('.ui-textarea__grip').trigger('pointerdown', { button: 0, clientY: 0 })
      document.dispatchEvent(new MouseEvent('pointermove', { clientY: 200 }))
      document.dispatchEvent(new MouseEvent('pointerup'))
      await nextTick()

      document.dispatchEvent(new MouseEvent('pointermove', { clientY: 400 }))
      await nextTick()

      expect(heightOf(wrapper)).toBe(200)
    })

    it('ignores a secondary-button press', async () => {
      const wrapper = await mount({ resizable: true })

      await wrapper.find('.ui-textarea__grip').trigger('pointerdown', { button: 2, clientY: 0 })

      expect(wrapper.classes()).not.toContain('ui-textarea--resizing')
    })

    it('freezes the grip while disabled', async () => {
      const wrapper = await mount({ resizable: true, disabled: true })

      await wrapper.find('.ui-textarea__grip').trigger('keydown', { key: 'ArrowDown' })

      expect(heightOf(wrapper)).toBeNull()
    })

    it('freezes the grip while read-only', async () => {
      const wrapper = await mount({ resizable: true, readonly: true })

      await wrapper.find('.ui-textarea__grip').trigger('keydown', { key: 'ArrowDown' })
      await wrapper.find('.ui-textarea__grip').trigger('pointerdown', { button: 0, clientY: 0 })

      expect(heightOf(wrapper)).toBeNull()
      expect(wrapper.classes()).not.toContain('ui-textarea--resizing')
    })

    it('outranks auto-growth once the user has sized the box by hand', async () => {
      const wrapper = await mount({ resizable: true, autoGrow: true, rows: 3 })

      await wrapper.find('.ui-textarea__grip').trigger('keydown', { key: 'ArrowDown' })
      await wrapper.find('textarea').setValue('a\nb\nc\nd\ne\nf')
      await nextTick()

      expect(heightOf(wrapper)).toBe(4 * ROW)
    })
  })

  describe('native attributes', () => {
    it('forwards the multiline attributes it owns', async () => {
      const wrapper = await mount({
        rows: 4,
        name: 'description',
        wrap: 'hard',
        placeholder: 'Describe the change',
        maxlength: 120,
        spellcheck: false,
      })
      const textarea = wrapper.find('textarea')

      expect(textarea.attributes('rows')).toBe('4')
      expect(textarea.attributes('name')).toBe('description')
      expect(textarea.attributes('wrap')).toBe('hard')
      expect(textarea.attributes('placeholder')).toBe('Describe the change')
      expect(textarea.attributes('maxlength')).toBe('120')
      expect(textarea.attributes('spellcheck')).toBe('false')
    })

    it('falls back to the validation path for the field name', async () => {
      const wrapper = await mount({ path: 'profile.bio' })

      expect(wrapper.find('textarea').attributes('name')).toBe('profile.bio')
    })

    it('forwards readonly, disabled and autocomplete', async () => {
      const wrapper = await mount({ readonly: true, disabled: true, autocomplete: 'off' })
      const textarea = wrapper.find('textarea')

      expect(textarea.attributes('readonly')).toBeDefined()
      expect(textarea.attributes('disabled')).toBeDefined()
      expect(textarea.attributes('autocomplete')).toBe('off')
    })

    it('never intercepts Tab — the field is not a keyboard trap', async () => {
      const wrapper = await mount()
      const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })

      wrapper.find('textarea').element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })
  })
})
