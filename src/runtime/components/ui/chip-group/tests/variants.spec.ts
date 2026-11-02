import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { MChip, MChipGroup, buttons, mountGroup, mountHost, pressed, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip-group · variants', () => {
  describe('layout', () => {
    it('defaults to a wrapping horizontal row', async () => {
      const { wrapper } = await mountGroup()
      const root = wrapper.find('.ui-chip-group')

      expect(root.classes()).toEqual(expect.arrayContaining(['ui-chip-group--horizontal', 'ui-chip-group--wrap']))
      expect(root.classes()).not.toContain('ui-chip-group--scroll')
    })

    it.each(['horizontal', 'vertical'] as const)('maps direction="%s" onto its modifier', async (direction) => {
      const { wrapper } = await mountGroup({ direction })

      expect(wrapper.find('.ui-chip-group').classes()).toContain(`ui-chip-group--${direction}`)
    })

    it.each([
      ['horizontal', true],
      ['vertical', false],
    ] as const)('without wrap, a %s group scrolls natively: %s', async (direction, scrolls) => {
      const { wrapper } = await mountGroup({ direction, wrap: false })
      const root = wrapper.find('.ui-chip-group')

      expect(root.classes()).not.toContain('ui-chip-group--wrap')
      expect(root.classes().includes('ui-chip-group--scroll')).toBe(scrolls)
    })
  })

  describe('data-driven items', () => {
    const items = [{ id: 'a', title: 'All' }, { id: 'b', title: 'Active' }, { id: 'c', title: 'Done', off: true }]

    function host(props: Record<string, unknown> = {}) {
      return defineComponent({
        setup() {
          const model = ref<unknown>(props.modelValue)
          return () => h(MChipGroup as never, {
            items,
            'itemValue': 'id',
            'itemKey': 'id',
            'itemDisabled': 'off',
            ...props,
            'modelValue': model.value,
            'onUpdate:modelValue': (value: unknown) => { model.value = value },
          }, {
            item: ({ item, props: bindings }: { item: { title: string }, props: Record<string, unknown> }) =>
              h(MChip, { type: 'filter', ...bindings }, () => item.title),
          })
        },
      })
    }

    it('renders one chip per item through the item slot', async () => {
      const wrapper = await mountHost(host())

      expect(buttons(wrapper).map(chip => chip.text())).toEqual(['All', 'Active', 'Done'])
    })

    it('resolves values by key, so a preset model selects its item', async () => {
      const wrapper = await mountHost(host({ modelValue: 'b' }))

      expect(pressed(wrapper)).toEqual(['false', 'true', 'false'])
    })

    it('hands the disabled resolver to the chip through the slot bindings', async () => {
      const wrapper = await mountHost(host())

      expect(buttons(wrapper)[2]!.attributes('disabled')).toBeDefined()
    })

    it('resolves value and key through getters as well', async () => {
      const wrapper = await mountHost(host({ itemValue: (item: { id: string }) => item.id.toUpperCase(), itemKey: (item: { id: string }) => item.id, modelValue: 'A' }))

      expect(pressed(wrapper)[0]).toBe('true')
    })

    it('renders the empty slot for an empty item list', async () => {
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, { items: [] }, {
          item: () => h(MChip, { type: 'filter' }),
          empty: () => h('span', { class: 'empty' }, 'Nothing'),
        }),
      }))

      expect(wrapper.find('.empty').exists()).toBe(true)
      expect(buttons(wrapper)).toHaveLength(0)
    })
  })

  describe('chip modifiers', () => {
    it('marks the selected chip', async () => {
      const { wrapper } = await mountGroup({ modelValue: 'b' })

      expect(buttons(wrapper).map(chip => chip.classes().includes('ui-chip--selected'))).toEqual([false, true, false])
    })

    it('marks unselected chips blocked once the max is reached', async () => {
      const { wrapper } = await mountGroup({ multiple: true, max: 1, modelValue: ['a'] })

      expect(buttons(wrapper).map(chip => chip.classes().includes('ui-chip--blocked'))).toEqual([false, true, true])
    })

    it('disables every chip natively with the group', async () => {
      const { wrapper } = await mountGroup({ disabled: true })

      expect(buttons(wrapper).every(chip => chip.attributes('disabled') !== undefined)).toBe(true)
      expect(buttons(wrapper).every(chip => chip.classes().includes('ui-chip--disabled'))).toBe(true)
    })
  })
})
