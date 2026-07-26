import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MChip from '../app/components/ui/chip/index.vue'
import MChipGroup from '../app/components/ui/chip-group/index.vue'
import MSelectionGroup from '../app/components/ui/selection-group/index.vue'

function chipGroupHost(groupProps: Record<string, unknown>, chips: Array<Record<string, unknown>>) {
  return defineComponent({
    setup() {
      const model = ref(groupProps.modelValue)
      return () =>
        h(
          MChipGroup as never,
          { ...groupProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => (model.value = value) },
          {
            default: () => chips.map(chip => h(MChip, { type: 'filter', ...chip }, () => String(chip.value ?? 'chip'))),
          },
        )
    },
  })
}

describe('MChip standalone regression', () => {
  it('keeps the boolean model for filter chips outside a group', async () => {
    const wrapper = await mountSuspended(MChip, { props: { type: 'filter' }, slots: { default: () => 'All' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
    // Standalone chips are ordinary buttons: no group ARIA, no roving tabindex.
    expect(wrapper.find('button').attributes('aria-pressed')).toBeUndefined()
    expect(wrapper.find('button').attributes('tabindex')).toBeUndefined()
  })

  it('does not toggle non-filter chips', async () => {
    const wrapper = await mountSuspended(MChip, { props: { type: 'assist' }, slots: { default: () => 'Help' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('never registers into an unrelated generic selection group', async () => {
    const host = defineComponent({
      setup: () => () =>
        h(MSelectionGroup as never, { modelValue: 'a' }, {
          default: () => [h(MChip, { type: 'filter', value: 'a' }, () => 'A')],
        }),
    })
    const wrapper = await mountSuspended(host)
    // Without a chip context the chip stays standalone: unselected, no aria-pressed.
    expect(wrapper.find('button').attributes('aria-pressed')).toBeUndefined()
    expect(wrapper.find('button').classes()).not.toContain('ui-chip--selected')
  })
})

describe('MChipGroup', () => {
  it('renders a group role with layout modifiers', async () => {
    const wrapper = await mountSuspended(chipGroupHost({}, [{ value: 'a' }]))
    const root = wrapper.find('.ui-chip-group')
    expect(root.attributes('role')).toBe('group')
    expect(root.classes()).toEqual(expect.arrayContaining(['ui-chip-group--horizontal', 'ui-chip-group--wrap']))
  })

  it('applies direction and native scrolling when wrap is off', async () => {
    const wrapper = await mountSuspended(chipGroupHost({ direction: 'vertical', wrap: false }, [{ value: 'a' }]))
    expect(wrapper.find('.ui-chip-group').classes()).toContain('ui-chip-group--vertical')

    const scroll = await mountSuspended(chipGroupHost({ wrap: false }, [{ value: 'a' }]))
    expect(scroll.find('.ui-chip-group').classes()).toContain('ui-chip-group--scroll')
  })

  it('selects a single stable value and exposes aria-pressed', async () => {
    const wrapper = await mountSuspended(chipGroupHost({}, [{ value: 'a' }, { value: 'b' }]))
    const chips = wrapper.findAll('button')
    expect(chips[0]!.attributes('aria-pressed')).toBe('false')

    await chips[1]!.trigger('click')
    await nextTick()
    expect(wrapper.findAll('button')[1]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('false')
  })

  it('applies an initial model to the matching chip', async () => {
    const wrapper = await mountSuspended(chipGroupHost({ modelValue: 'b' }, [{ value: 'a' }, { value: 'b' }]))
    await nextTick()
    expect(wrapper.findAll('button')[1]!.classes()).toContain('ui-chip--selected')
  })

  it('supports multiple selection', async () => {
    const wrapper = await mountSuspended(chipGroupHost({ multiple: true }, [{ value: 'a' }, { value: 'b' }]))
    await wrapper.findAll('button')[0]!.trigger('click')
    await wrapper.findAll('button')[1]!.trigger('click')
    await nextTick()
    const pressed = wrapper.findAll('button').filter(chip => chip.attributes('aria-pressed') === 'true')
    expect(pressed).toHaveLength(2)
  })

  it('blocks unselected chips at the max limit while keeping selected ones operable', async () => {
    const wrapper = await mountSuspended(
      chipGroupHost({ multiple: true, max: 1 }, [{ value: 'a' }, { value: 'b' }]),
    )
    await wrapper.findAll('button')[0]!.trigger('click')
    await nextTick()

    const blocked = wrapper.findAll('button')[1]!
    expect(blocked.attributes('aria-disabled')).toBe('true')
    expect(blocked.classes()).toContain('ui-chip--blocked')

    await blocked.trigger('click')
    await nextTick()
    expect(wrapper.findAll('button')[1]!.attributes('aria-pressed')).toBe('false')

    // The selected chip stays operable so capacity can be freed.
    await wrapper.findAll('button')[0]!.trigger('click')
    await nextTick()
    expect(wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('false')
    expect(wrapper.findAll('button')[1]!.attributes('aria-disabled')).toBeUndefined()
  })

  it('keeps at least one selection with mandatory', async () => {
    const wrapper = await mountSuspended(chipGroupHost({ mandatory: true, modelValue: 'a' }, [{ value: 'a' }, { value: 'b' }]))
    await nextTick()
    await wrapper.findAll('button')[0]!.trigger('click')
    await nextTick()
    expect(wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('true')
  })

  it('natively disables chips when the group is disabled', async () => {
    const wrapper = await mountSuspended(chipGroupHost({ disabled: true }, [{ value: 'a' }]))
    await nextTick()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('gives the group exactly one tab stop and moves it to the selection', async () => {
    const wrapper = await mountSuspended(chipGroupHost({}, [{ value: 'a' }, { value: 'b' }]))
    await nextTick()
    const tabindexes = () => wrapper.findAll('button').map(chip => chip.attributes('tabindex'))
    expect(tabindexes()).toEqual(['0', '-1'])

    await wrapper.findAll('button')[1]!.trigger('click')
    await nextTick()
    expect(tabindexes()).toEqual(['-1', '0'])
  })

  it('moves focus with arrows, Home and End', async () => {
    const wrapper = await mountSuspended(
      chipGroupHost({}, [{ value: 'a' }, { value: 'b' }, { value: 'c' }]),
      { attachTo: document.body },
    )
    await nextTick()
    const chips = wrapper.findAll('button')

    await chips[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(chips[1]!.element)

    await chips[1]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(chips[0]!.element)

    await chips[0]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(chips[2]!.element)

    await chips[2]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(chips[0]!.element)

    // The ring wraps rather than dead-ending at the last chip.
    await chips[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(chips[2]!.element)
    wrapper.unmount()
  })

  it('skips disabled chips during focus movement', async () => {
    const wrapper = await mountSuspended(
      chipGroupHost({}, [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }]),
      { attachTo: document.body },
    )
    await nextTick()
    const chips = wrapper.findAll('button')

    await chips[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(chips[2]!.element)
    wrapper.unmount()
  })

  it('leaves a chip without value standalone inside a group', async () => {
    const wrapper = await mountSuspended(chipGroupHost({}, [{ value: 'a' }, { type: 'assist' }]))
    await nextTick()
    const chips = wrapper.findAll('button')
    expect(chips[1]!.attributes('aria-pressed')).toBeUndefined()
    // Standalone chips keep their own tab stop next to the roving registry.
    expect(chips[1]!.attributes('tabindex')).toBeUndefined()
  })

  it('renders data-driven items through the item slot with safe bindings', async () => {
    const host = defineComponent({
      setup() {
        const model = ref('b')
        const items = [{ id: 'a', title: 'All' }, { id: 'b', title: 'Active' }]
        return () =>
          h(
            MChipGroup as never,
            {
              'items': items,
              'itemValue': 'id',
              'itemKey': 'id',
              'modelValue': model.value,
              'onUpdate:modelValue': (value: unknown) => (model.value = value),
            },
            {
              item: ({ item, props }: { item: { title: string }, props: Record<string, unknown> }) =>
                h(MChip, { type: 'filter', ...props }, () => item.title),
            },
          )
      },
    })
    const wrapper = await mountSuspended(host)
    await nextTick()
    const chips = wrapper.findAll('button')
    expect(chips).toHaveLength(2)
    expect(chips[1]!.attributes('aria-pressed')).toBe('true')
  })

  it('renders the empty slot for an empty item list', async () => {
    const host = defineComponent({
      setup: () => () =>
        h(MChipGroup as never, { items: [] }, {
          item: () => h(MChip, { type: 'filter' }),
          empty: () => h('span', { class: 'empty' }, 'Nothing'),
        }),
    })
    const wrapper = await mountSuspended(host)
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('cleans up tickets when a chip unmounts', async () => {
    const host = defineComponent({
      setup() {
        const model = ref<string[]>(['a', 'b'])
        const visible = ref(true)
        return { model, visible }
      },
      render() {
        return h(
          MChipGroup as never,
          { 'multiple': true, 'modelValue': this.model, 'onUpdate:modelValue': (value: string[]) => (this.model = value) },
          {
            default: () => [
              h(MChip, { type: 'filter', value: 'a' }, () => 'A'),
              this.visible ? h(MChip, { type: 'filter', value: 'b' }, () => 'B') : null,
            ],
          },
        )
      },
    })
    const wrapper = await mountSuspended(host)
    await nextTick()
    expect(wrapper.findAll('button')).toHaveLength(2)

    wrapper.vm.visible = false
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('button')).toHaveLength(1)
    // The removed chip's value leaves the model instead of lingering.
    expect(wrapper.vm.model).toEqual(['a'])
  })
})
