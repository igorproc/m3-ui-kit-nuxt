import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { MChip, MChipGroup, buttons, mountGroup, mountHost, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

const focused = () => document.activeElement

describe('m-chip-group · keyboard', () => {
  describe('roving tab stop', () => {
    it('gives the group one tab stop, on the first chip without a selection', async () => {
      const { wrapper } = await mountGroup()

      expect(buttons(wrapper).map(chip => chip.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    })

    it('moves the tab stop to the selected chip', async () => {
      const { wrapper } = await mountGroup()

      await buttons(wrapper)[2]!.trigger('click')
      await nextTick()

      expect(buttons(wrapper).map(chip => chip.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    })

    it('brings Tab back to the chip the arrows left focus on, not to the selection', async () => {
      const { wrapper } = await mountGroup({ modelValue: 'a' }, undefined, true)
      const chips = buttons(wrapper)
      ;(chips[0]!.element as HTMLElement).focus()

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })
      await chips[1]!.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()

      expect(focused()).toBe(chips[2]!.element)
      expect(buttons(wrapper).map(chip => chip.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    })

    it('enters on the selected chip the first time', async () => {
      const { wrapper } = await mountGroup({ modelValue: 'b' })

      expect(buttons(wrapper).map(chip => chip.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    })

    it('skips a disabled first chip for the tab stop', async () => {
      const { wrapper } = await mountGroup({}, [{ value: 'a', disabled: true }, { value: 'b' }])

      expect(buttons(wrapper)[1]!.attributes('tabindex')).toBe('0')
    })
  })

  describe('horizontal arrows', () => {
    it('moves focus with ArrowRight / ArrowLeft and wraps at both ends', async () => {
      const { wrapper } = await mountGroup({}, undefined, true)
      const chips = buttons(wrapper)

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })
      expect(focused()).toBe(chips[1]!.element)

      await chips[1]!.trigger('keydown', { key: 'ArrowLeft' })
      expect(focused()).toBe(chips[0]!.element)

      await chips[0]!.trigger('keydown', { key: 'ArrowLeft' })
      expect(focused()).toBe(chips[2]!.element)

      await chips[2]!.trigger('keydown', { key: 'ArrowRight' })
      expect(focused()).toBe(chips[0]!.element)
    })

    it('jumps to the ends with Home and End', async () => {
      const { wrapper } = await mountGroup({}, undefined, true)
      const chips = buttons(wrapper)

      await chips[0]!.trigger('keydown', { key: 'End' })
      expect(focused()).toBe(chips[2]!.element)

      await chips[2]!.trigger('keydown', { key: 'Home' })
      expect(focused()).toBe(chips[0]!.element)
    })

    it('ignores the vertical arrows in a horizontal group', async () => {
      const { wrapper } = await mountGroup({}, undefined, true)
      const chips = buttons(wrapper)
      ;(chips[0]!.element as HTMLElement).focus()

      await chips[0]!.trigger('keydown', { key: 'ArrowDown' })

      expect(focused()).toBe(chips[0]!.element)
    })

    it('skips disabled chips', async () => {
      const { wrapper } = await mountGroup({}, [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }], true)
      const chips = buttons(wrapper)

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(focused()).toBe(chips[2]!.element)
    })

    it('skips chips blocked by the max, so a full group cycles its selection', async () => {
      const { wrapper } = await mountGroup({ multiple: true, max: 2, modelValue: ['a', 'c'] }, undefined, true)
      const chips = buttons(wrapper)

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(focused()).toBe(chips[2]!.element)
    })
  })

  describe('DOM order', () => {
    it('follows the chips as they stand in the document after a reorder, not as they registered', async () => {
      const order = ref(['a', 'b', 'c'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          default: () => order.value.map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }), true)

      order.value = ['c', 'a', 'b']
      await nextTick()
      const chips = buttons(wrapper)
      expect(chips.map(chip => chip.text())).toEqual(['c', 'a', 'b'])

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })
      expect(focused()).toBe(chips[1]!.element)

      await chips[1]!.trigger('keydown', { key: 'Home' })
      expect(focused()).toBe(chips[0]!.element)
    })

    it('places a chip rendered later between its neighbours in the arrow order', async () => {
      const middle = ref(false)
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          default: () => [
            h(MChip, { key: 'a', type: 'filter', value: 'a' }, () => 'a'),
            middle.value ? h(MChip, { key: 'b', type: 'filter', value: 'b' }, () => 'b') : null,
            h(MChip, { key: 'c', type: 'filter', value: 'c' }, () => 'c'),
          ],
        }),
      }), true)

      middle.value = true
      await nextTick()
      const chips = buttons(wrapper)

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })
      expect(focused()).toBe(chips[1]!.element)
      expect(chips[1]!.text()).toBe('b')
    })
  })

  describe('removal', () => {
    it('hands focus to the next chip when the focused one is removed', async () => {
      const values = ref(['a', 'b', 'c'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          default: () => values.value.map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }), true)
      ;(buttons(wrapper)[1]!.element as HTMLElement).focus()

      values.value = ['a', 'c']
      await nextTick()

      expect(focused()).toBe(buttons(wrapper)[1]!.element)
      expect(buttons(wrapper)[1]!.text()).toBe('c')
    })

    it('hands focus to the previous chip when the last one is removed', async () => {
      const values = ref(['a', 'b'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          default: () => values.value.map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }), true)
      ;(buttons(wrapper)[1]!.element as HTMLElement).focus()

      values.value = ['a']
      await nextTick()

      expect(focused()).toBe(buttons(wrapper)[0]!.element)
    })

    it('hands focus to the row itself when the last chip goes with it', async () => {
      const values = ref(['a'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, { 'aria-label': 'Tags' }, {
          default: () => values.value.map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }), true)
      ;(buttons(wrapper)[0]!.element as HTMLElement).focus()

      values.value = []
      await nextTick()
      await nextTick()

      const row = wrapper.find('[role="group"]')
      expect(focused()).toBe(row.element)
      expect(row.attributes('tabindex')).toBe('-1')
    })

    it('keeps the row a stop while a chip reports its own focusout, and gives it up when the row loses focus', async () => {
      const values = ref(['a'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, { 'aria-label': 'Tags' }, {
          default: () => values.value.map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }), true)
      ;(buttons(wrapper)[0]!.element as HTMLElement).focus()
      values.value = []
      await nextTick()
      await nextTick()
      const row = wrapper.find('[role="group"]')

      const child = document.createElement('span')
      row.element.append(child)
      child.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      child.remove()
      await nextTick()
      expect(row.attributes('tabindex')).toBe('-1')

      row.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      await nextTick()
      expect(row.attributes('tabindex')).toBeUndefined()
    })

    it('leaves focus alone when a chip that did not have it is removed', async () => {
      const values = ref(['a', 'b', 'c'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          default: () => values.value.map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }), true)
      const first = buttons(wrapper)[0]!.element as HTMLElement
      first.focus()

      values.value = ['a', 'c']
      await nextTick()

      expect(focused()).toBe(first)
    })
  })

  describe('vertical arrows', () => {
    it('moves focus with ArrowDown / ArrowUp in a vertical group', async () => {
      const { wrapper } = await mountGroup({ direction: 'vertical' }, undefined, true)
      const chips = buttons(wrapper)

      await chips[0]!.trigger('keydown', { key: 'ArrowDown' })
      expect(focused()).toBe(chips[1]!.element)

      await chips[1]!.trigger('keydown', { key: 'ArrowUp' })
      expect(focused()).toBe(chips[0]!.element)
    })

    it('ignores the horizontal arrows in a vertical group', async () => {
      const { wrapper } = await mountGroup({ direction: 'vertical' }, undefined, true)
      const chips = buttons(wrapper)
      ;(chips[0]!.element as HTMLElement).focus()

      await chips[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(focused()).toBe(chips[0]!.element)
    })
  })

  describe('activation', () => {
    it('leaves Space and Enter to the native button', async () => {
      const { wrapper } = await mountGroup({}, undefined, true)
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })

      buttons(wrapper)[0]!.element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })
  })
})
