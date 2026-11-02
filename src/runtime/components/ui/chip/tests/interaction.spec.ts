import { afterEach, describe, expect, it, vi } from 'vitest'
import { TYPES, mount, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip · interaction', () => {
  describe('filter model', () => {
    it('toggles the model on click, one emit per press', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: false })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    })

    it('turns a selected filter chip off', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: true })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('follows a model the parent changes', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: false })

      await wrapper.setProps({ modelValue: true })

      expect(wrapper.classes()).toContain('ui-chip--selected')
    })

    it.each(TYPES.filter(type => type !== 'filter'))('leaves the model of a %s chip alone — it is an action, not a toggle', async (type) => {
      const wrapper = await mount({ type, modelValue: false })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('does not toggle while disabled', async () => {
      const wrapper = await mount({ type: 'filter', disabled: true, modelValue: false })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('actions', () => {
    it('hands a press to the consumer click listener', async () => {
      const onClick = vi.fn()
      const wrapper = await mount({ onClick })

      await wrapper.trigger('click')

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('never submits a surrounding form', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('type')).toBe('button')
    })
  })

  describe('focus', () => {
    it('is focusable on its own outside a group', async () => {
      const wrapper = await mount({}, undefined, true)

      ;(wrapper.element as HTMLButtonElement).focus()

      expect(document.activeElement).toBe(wrapper.element)
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })
  })
})
