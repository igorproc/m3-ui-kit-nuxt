import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { buttons, mountGroup, pressed, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip-group · a11y', () => {
  describe('role', () => {
    it('groups its chips under role="group"', async () => {
      const { wrapper } = await mountGroup()

      expect(wrapper.find('.ui-chip-group__chips').attributes('role')).toBe('group')
    })

    it('keeps every chip a native button', async () => {
      const { wrapper } = await mountGroup()

      expect(buttons(wrapper).every(chip => chip.attributes('type') === 'button')).toBe(true)
    })
  })

  describe('state', () => {
    it('announces the selection through aria-pressed on every grouped chip', async () => {
      const { wrapper } = await mountGroup({ modelValue: 'a' })

      expect(pressed(wrapper)).toEqual(['true', 'false', 'false'])
    })

    it('keeps a chip blocked by the max focusable but unavailable', async () => {
      const { wrapper } = await mountGroup({ multiple: true, max: 1, modelValue: ['a'] })
      const blocked = buttons(wrapper)[1]!

      expect(blocked.attributes('aria-disabled')).toBe('true')
      expect(blocked.attributes('disabled')).toBeUndefined()
    })

    it('disables chips natively, not through aria-disabled, when the group is disabled', async () => {
      const { wrapper } = await mountGroup({ disabled: true })

      expect(buttons(wrapper)[0]!.attributes('disabled')).toBeDefined()
    })
  })

  describe('standalone chips inside a group', () => {
    it('leaves a chip without a value out of the group semantics and the roving stop', async () => {
      const { wrapper } = await mountGroup({}, [{ value: 'a' }, { type: 'assist' }])
      await nextTick()
      const assist = buttons(wrapper)[1]!

      expect(assist.attributes('aria-pressed')).toBeUndefined()
      expect(assist.attributes('tabindex')).toBeUndefined()
    })
  })
})
