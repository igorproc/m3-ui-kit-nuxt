import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import MChip from '../index.vue'
import MChipGroup from '#kit/components/ui/chip-group/index.vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mount, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip · removal', () => {
  describe('separate remove button', () => {
    it('emits remove from the remove button and leaves the selection alone', async () => {
      const wrapper = await mount({ type: 'filter', removal: 'button', removeLabel: 'Remove', modelValue: false })

      await wrapper.find('.ui-chip__remove').trigger('click')

      expect(wrapper.emitted('remove')).toEqual([[]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('keeps the main action a toggle', async () => {
      const wrapper = await mount({ type: 'filter', removal: 'button', removeLabel: 'Remove', modelValue: false })

      await wrapper.find('.ui-chip__action').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
      expect(wrapper.emitted('remove')).toBeUndefined()
    })

    it('names the remove action and keeps it out of the Tab order', async () => {
      const wrapper = await mount({ type: 'input', removal: 'button', removeLabel: 'Remove Ada' })
      const remove = wrapper.find('.ui-chip__remove')

      expect(remove.attributes('aria-label')).toBe('Remove Ada')
      expect(remove.attributes('tabindex')).toBe('-1')
      expect(remove.attributes('type')).toBe('button')
    })

    it('hides the close glyph — the button name says it', async () => {
      const wrapper = await mount({ type: 'input', removal: 'button', removeLabel: 'Remove Ada' })

      expect(wrapper.find('.ui-chip__remove .ui-icon').attributes('aria-hidden')).toBe('true')
    })

    it('disables both actions with the chip, and emits nothing', async () => {
      const wrapper = await mount({ type: 'input', removal: 'button', removeLabel: 'Remove', disabled: true })

      expect(wrapper.find('.ui-chip__action').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.ui-chip__remove').attributes('disabled')).toBeDefined()
      await wrapper.find('.ui-chip__remove').trigger('click')
      expect(wrapper.emitted('remove')).toBeUndefined()
    })

    it('walks main → remove with ArrowRight and back with ArrowLeft', async () => {
      const wrapper = await mount({ type: 'input', removal: 'button', removeLabel: 'Remove' }, undefined, true)
      const action = wrapper.find('.ui-chip__action')
      const remove = wrapper.find('.ui-chip__remove')

      await action.trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(remove.element)

      await remove.trigger('keydown', { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(action.element)
    })

    it('passes the arrows on to the group at the chip edge', async () => {
      const values = ref(['a', 'b'])
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          default: () => values.value.map(value => h(MChip, { key: value, type: 'filter', value, removal: 'button', removeLabel: `Remove ${value}` }, () => value)),
        }),
      }), { attachTo: document.body })
      await nextTick()
      const actions = wrapper.findAll('.ui-chip__action')
      const removes = wrapper.findAll('.ui-chip__remove')

      await removes[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(document.activeElement).toBe(actions[1]!.element)
      wrapper.unmount()
    })
  })

  describe('whole chip', () => {
    it('emits remove on a press and toggles nothing', async () => {
      const wrapper = await mount({ type: 'filter', removal: 'whole', removeLabel: 'Remove', modelValue: false })

      await wrapper.trigger('click')

      expect(wrapper.emitted('remove')).toEqual([[]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('is named by the remove label and announces no pressed state', async () => {
      const wrapper = await mount({ type: 'filter', removal: 'whole', removeLabel: 'Remove Moscow' })

      expect(wrapper.attributes('aria-label')).toBe('Remove Moscow')
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('emits nothing while disabled', async () => {
      const wrapper = await mount({ type: 'input', removal: 'whole', removeLabel: 'Remove', disabled: true })

      await wrapper.trigger('click')

      expect(wrapper.emitted('remove')).toBeUndefined()
    })

    it('keeps a consumer tabindex and aria-label when it has none of its own', async () => {
      const wrapper = await mount({ 'type': 'input', 'tabindex': '-1', 'aria-label': 'Moscow' })

      expect(wrapper.attributes('tabindex')).toBe('-1')
      expect(wrapper.attributes('aria-label')).toBe('Moscow')
    })
  })
})
