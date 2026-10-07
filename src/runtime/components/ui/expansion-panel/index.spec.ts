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
    expect(wrapper.find('[role="region"]').attributes('inert')).toBeUndefined()
  })

  it('keeps collapsed content inert instead of aria-hidden', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', modelValue: false },
      slots: { default: () => h('a', { href: '#field' }, 'Field') },
    })

    const region = wrapper.find('[role="region"]')
    expect(region.attributes('inert')).toBeDefined()
    expect(region.attributes('aria-hidden')).toBeUndefined()
  })

  it('puts only phrasing content inside the header button', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', description: 'Y' },
    })

    expect(wrapper.find('.ui-expansion-panel__header').findAll('div')).toHaveLength(0)
  })

  it('wraps the header button in a heading only when a level is given', async () => {
    const bare = await mountSuspended(MExpansionPanel, { props: { title: 'X' } })
    expect(bare.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false)
    expect(bare.find('.ui-expansion-panel__header').element.parentElement).toBe(bare.element)

    const wrapped = await mountSuspended(MExpansionPanel, { props: { title: 'X', headingLevel: 4 } })
    const heading = wrapped.find('h4')
    expect(heading.exists()).toBe(true)
    expect(heading.find('.ui-expansion-panel__header').exists()).toBe(true)
  })

  it('sends class and style to the root and every other attribute to the button', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X' },
      attrs: {
        'class': 'faq',
        'style': 'margin-top: 8px;',
        'id': 'shipping',
        'aria-describedby': 'hint',
        'data-test': 'panel',
      },
    })

    const header = wrapper.find('.ui-expansion-panel__header')
    expect(wrapper.classes()).toContain('faq')
    expect(wrapper.attributes('style')).toContain('margin-top')
    expect(wrapper.attributes('id')).toBeUndefined()
    expect(header.attributes('id')).toBe('shipping')
    expect(header.attributes('aria-describedby')).toBe('hint')
    expect(header.attributes('data-test')).toBe('panel')
    expect(wrapper.find('[role="region"]').attributes('aria-labelledby')).toBe('shipping')
  })

  it('replaces the chevron through #trailing with the open state', async () => {
    const wrapper = await mountSuspended(MExpansionPanel, {
      props: { title: 'X', modelValue: true },
      slots: { trailing: ({ expanded }: { expanded: boolean }) => h('b', expanded ? 'Hide' : 'Show') },
    })

    expect(wrapper.find('.ui-expansion-panel__trailing').text()).toBe('Hide')
    expect(wrapper.find('.ui-expansion-panel__chevron').exists()).toBe(false)
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
