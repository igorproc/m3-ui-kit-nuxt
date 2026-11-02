import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MChip from '../index.vue'
import MSelectionGroup from '#kit/components/ui/selection-group/index.vue'
import { TYPES, mount, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip · a11y', () => {
  describe('role', () => {
    it.each(TYPES)('a %s chip is a native button', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('role')).toBeUndefined()
    })
  })

  describe('naming', () => {
    it('is named by its label text', async () => {
      const wrapper = await mount({}, { default: () => 'Add to calendar' })

      expect(wrapper.text()).toBe('Add to calendar')
    })
  })

  describe('state', () => {
    it.each([
      [true, 'true'],
      [false, 'false'],
    ])('announces a standalone filter chip with model %s as aria-pressed="%s"', async (modelValue, pressed) => {
      const wrapper = await mount({ type: 'filter', modelValue })

      expect(wrapper.attributes('aria-pressed')).toBe(pressed)
    })

    it('updates aria-pressed when a standalone filter chip is toggled', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: false })

      await wrapper.trigger('click')
      await wrapper.setProps({ modelValue: true })

      expect(wrapper.attributes('aria-pressed')).toBe('true')
    })

    it.each(TYPES.filter(type => type !== 'filter'))('announces no pressed state on a %s chip — it does not toggle', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('stays out of an unrelated selection group', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MSelectionGroup as never, { modelValue: 'a' }, {
          default: () => [h(MChip, { type: 'filter', value: 'a' }, () => 'A')],
        }),
      }))

      // No chip context, so the chip stays standalone and reads its own model.
      expect(wrapper.find('button').classes()).not.toContain('ui-chip--selected')
      expect(wrapper.find('button').attributes('aria-pressed')).toBe('false')
      wrapper.unmount()
    })

    it('leaves the Tab order through the native disabled attribute', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })
  })
})
