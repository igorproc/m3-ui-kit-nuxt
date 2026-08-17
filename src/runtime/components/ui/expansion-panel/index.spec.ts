import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MExpansionPanel from './index.vue'
import MExpansionPanels from '#kit/components/ui/expansion-panels/index.vue'

describe('m-expansion-panel', () => {
  it('renders the header button with title and chevron', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'Details' },
    })

    expect(wrapper.find('.ui-expansion-panel').exists()).toBe(true)
    expect(wrapper.find('.ui-expansion-panel__header').element.tagName).toBe('BUTTON')
    expect(wrapper.find('.ui-expansion-panel__title').text()).toBe('Details')
  })

  it('renders default slot content into the region', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X' },
      slots: { default: () => 'Body text' },
    })

    expect(wrapper.find('.ui-expansion-panel__content').text()).toBe('Body text')
  })

  it('wires aria-expanded / aria-controls and a labelled region', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', modelValue: false },
    })

    const header = wrapper.find('.ui-expansion-panel__header')
    const region = wrapper.find('[role="region"]')

    expect(header.attributes('aria-expanded')).toBe('false')
    const controls = header.attributes('aria-controls')
    expect(controls).toBeTruthy()
    expect(region.attributes('id')).toBe(controls)
    expect(region.attributes('aria-labelledby')).toBe(header.attributes('id'))
  })

  it('reflects the open state through aria-expanded and the expanded class', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', modelValue: true },
    })

    expect(wrapper.classes()).toContain('ui-expansion-panel--expanded')
    expect(wrapper.find('.ui-expansion-panel__header').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="region"]').attributes('aria-hidden')).toBe('false')
  })

  it('toggles the v-model on header click', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', modelValue: false },
    })

    await wrapper.find('.ui-expansion-panel__header').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('sets disabled on the header and suppresses toggle when disabled', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', modelValue: false, disabled: true },
    })

    const header = wrapper.find('.ui-expansion-panel__header')
    expect(header.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ui-expansion-panel--disabled')

    await header.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('m-expansion-panels (group)', () => {
  function group(props: Record<string, unknown>) {
    return defineComponent({
      render: () => h(MExpansionPanels, props, () => [
        h(MExpansionPanel, { value: 'a', title: 'A' }, () => 'A body'),
        h(MExpansionPanel, { value: 'b', title: 'B' }, () => 'B body'),
      ]),
    })
  }

  it('renders the group container with its panels', async () => {
    const wrapper = await mountSuspended(group({}))

    expect(wrapper.find('.ui-expansion-panels').exists()).toBe(true)
    expect(wrapper.findAll('.ui-expansion-panel')).toHaveLength(2)
  })

  it('opens the clicked panel in exclusive mode', async () => {
    // NB: initial model values are not applied to grouped panels (see bug
    // report), so the open panel is asserted after a click rather than at mount.
    const wrapper = await mountSuspended(group({}))

    const headers = wrapper.findAll('.ui-expansion-panel__header')
    await headers[1]!.trigger('click')

    const panels = wrapper.findAll('.ui-expansion-panel')
    expect(panels[0]!.classes()).not.toContain('ui-expansion-panel--expanded')
    expect(panels[1]!.classes()).toContain('ui-expansion-panel--expanded')
  })

  it('exclusive accordion: opening one closes the other', async () => {
    const wrapper = await mountSuspended(group({ modelValue: 'a' }))

    const headers = wrapper.findAll('.ui-expansion-panel__header')
    await headers[1]!.trigger('click')

    const events = wrapper.findComponent(MExpansionPanels).emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events!.at(-1)).toEqual(['b'])
  })

  it('multiple mode accumulates open values into an array', async () => {
    // NB: starts with no model — initial array model values are not applied to
    // the group registry (see bug report), so we drive opens via clicks.
    const wrapper = await mountSuspended(group({ multiple: true }))

    const headers = wrapper.findAll('.ui-expansion-panel__header')
    await headers[0]!.trigger('click')
    await headers[1]!.trigger('click')

    const events = wrapper.findComponent(MExpansionPanels).emitted('update:modelValue')
    expect(events).toBeTruthy()
    const last = events!.at(-1)![0] as string[]
    expect([...last].sort()).toEqual(['a', 'b'])
  })
})
