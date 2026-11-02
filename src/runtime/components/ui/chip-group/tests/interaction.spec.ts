import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { MChip, MChipGroup, buttons, mountGroup, mountHost, pressed, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip-group · interaction', () => {
  describe('single selection', () => {
    it('writes the pressed chip value to the model', async () => {
      const { wrapper, model } = await mountGroup()

      await buttons(wrapper)[1]!.trigger('click')

      expect(model.value).toBe('b')
      expect(pressed(wrapper)).toEqual(['false', 'true', 'false'])
    })

    it('moves the selection to the next pressed chip', async () => {
      const { wrapper, model } = await mountGroup({ modelValue: 'a' })

      await buttons(wrapper)[2]!.trigger('click')
      await nextTick()

      expect(model.value).toBe('c')
      expect(pressed(wrapper)).toEqual(['false', 'false', 'true'])
    })

    it('lets a chip be pressed off without mandatory', async () => {
      const { wrapper, model } = await mountGroup({ modelValue: 'a' })

      await buttons(wrapper)[0]!.trigger('click')
      await nextTick()

      expect(model.value).toBeUndefined()
    })

    it('keeps the last selection with mandatory', async () => {
      const { wrapper, model } = await mountGroup({ mandatory: true, modelValue: 'a' })

      await buttons(wrapper)[0]!.trigger('click')
      await nextTick()

      expect(model.value).toBe('a')
      expect(pressed(wrapper)[0]).toBe('true')
    })

    it('follows a model the parent changes', async () => {
      const { wrapper, model } = await mountGroup({ modelValue: 'a' })

      model.value = 'c'
      await nextTick()
      await nextTick()

      expect(pressed(wrapper)).toEqual(['false', 'false', 'true'])
    })
  })

  describe('multiple selection', () => {
    it('accumulates values into an array', async () => {
      const { wrapper, model } = await mountGroup({ multiple: true })

      await buttons(wrapper)[0]!.trigger('click')
      await buttons(wrapper)[1]!.trigger('click')
      await nextTick()

      expect(model.value).toEqual(['a', 'b'])
    })

    it('refuses a chip past the max and keeps the selected ones operable', async () => {
      const { wrapper, model } = await mountGroup({ multiple: true, max: 1 })

      await buttons(wrapper)[0]!.trigger('click')
      await nextTick()
      await buttons(wrapper)[1]!.trigger('click')
      await nextTick()
      expect(model.value).toEqual(['a'])

      // Freeing capacity unblocks the rest.
      await buttons(wrapper)[0]!.trigger('click')
      await nextTick()
      expect(model.value).toEqual([])
      expect(buttons(wrapper)[1]!.attributes('aria-disabled')).toBeUndefined()
    })

    it('compares values with a custom comparator', async () => {
      const a = { id: 1 }
      const { wrapper } = await mountGroup(
        { multiple: true, modelValue: [{ id: 1 }], valueComparator: (left: { id: number }, right: { id: number }) => left.id === right.id },
        [{ value: a }, { value: { id: 2 } }],
      )

      expect(pressed(wrapper)).toEqual(['true', 'false'])
    })
  })

  describe('dynamic chips', () => {
    it('drops a removed chip and its value from the model', async () => {
      const visible = ref(true)
      const model = ref<string[]>(['a', 'b'])
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {
          'multiple': true,
          'modelValue': model.value,
          'onUpdate:modelValue': (value: string[]) => { model.value = value },
        }, {
          default: () => [
            h(MChip, { type: 'filter', value: 'a' }, () => 'A'),
            visible.value ? h(MChip, { type: 'filter', value: 'b' }, () => 'B') : null,
          ],
        }),
      }))

      visible.value = false
      await nextTick()
      await nextTick()

      expect(buttons(wrapper)).toHaveLength(1)
      expect(model.value).toEqual(['a'])
    })
  })

  describe('server render', () => {
    it('ships the chip matching a preset model as selected in the first frame', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MChipGroup as never, { modelValue: 'b', ariaLabel: 'Tags' }, {
          default: () => ['a', 'b'].map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }))

      expect(html.match(/ui-chip--selected/g)).toHaveLength(1)
      expect(html).toContain('aria-pressed="true"')
    })

    it('ships every chip of a preset multiple model as selected', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MChipGroup as never, { modelValue: ['a', 'c'], multiple: true, ariaLabel: 'Tags' }, {
          default: () => ['a', 'b', 'c'].map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
        }),
      }))

      expect(html.match(/ui-chip--selected/g)).toHaveLength(2)
    })
  })

  describe('slot state', () => {
    it('hands the selection and its actions to the default slot', async () => {
      let seen: Record<string, unknown> = {}
      await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, { multiple: true, max: 1, modelValue: ['a'] }, {
          default: (slot: Record<string, unknown>) => {
            seen = slot
            return [h(MChip, { type: 'filter', value: 'a' }, () => 'A')]
          },
        }),
      }))

      expect(seen.selected).toEqual(['a'])
      expect(seen.multiple).toBe(true)
      expect(seen.selectionLimitReached).toBe(true)
      expect(typeof seen.toggle).toBe('function')
    })
  })
})
