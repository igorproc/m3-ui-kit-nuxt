import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import MTabs from './index.vue'
import MTabPanel from './panel/index.vue'

const items = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three', disabled: true },
]

describe('m-tabs', () => {
  it('renders a tablist with one role="tab" per item', async () => {
    const wrapper = await mountSuspended(MTabs, { props: { items } })

    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
  })

  it('auto-selects the first tab (mandatory force) with aria-selected', async () => {
    const wrapper = await mountSuspended(MTabs, { props: { items } })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    expect(tabs[1]!.attributes('aria-selected')).toBe('false')
    expect(tabs[0]!.classes()).toContain('ui-tabs__tab--active')
  })

  it('uses roving tabindex (selected tab is the only tabbable one)', async () => {
    const wrapper = await mountSuspended(MTabs, { props: { items } })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]!.attributes('tabindex')).toBe('0')
    expect(tabs[1]!.attributes('tabindex')).toBe('-1')
  })

  it('wires aria-controls on the tab to the panel id', async () => {
    const wrapper = await mountSuspended(MTabs, { props: { items } })

    const firstTab = wrapper.findAll('[role="tab"]')[0]!
    expect(firstTab.attributes('aria-controls')).toBeTruthy()
  })

  it('selects a tab on click and updates the v-model', async () => {
    const wrapper = await mountSuspended(MTabs, {
      props: { items, modelValue: 'one' },
    })

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events!.at(-1)).toEqual(['two'])
  })

  it('renders route-backed items as Nuxt links', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/components/button/overview', component: { template: '<div />' } },
        { path: '/components/button/reference', component: { template: '<div />' } },
      ],
    })
    await router.push('/components/button/overview')
    await router.isReady()

    const wrapper = await mountSuspended(MTabs, {
      global: { plugins: [router] },
      props: {
        items: [
          { value: 'overview', label: 'Overview', to: '/components/button/overview' },
          { value: 'reference', label: 'Reference', to: '/components/button/reference' },
        ],
        modelValue: 'overview',
      },
    })

    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs[0]!.element.tagName).toBe('A')
    expect(tabs[0]!.attributes('href')).toBe('/components/button/overview')
  })

  it('does not select a disabled tab on click', async () => {
    const wrapper = await mountSuspended(MTabs, {
      props: { items, modelValue: 'one' },
    })

    const disabledTab = wrapper.findAll('[role="tab"]')[2]!
    expect(disabledTab.attributes('disabled')).toBeDefined()

    await disabledTab.trigger('click')
    const events = wrapper.emitted('update:modelValue') ?? []
    expect(events.some(e => e[0] === 'three')).toBe(false)
  })

  it('moves selection with ArrowRight (automatic activation)', async () => {
    const wrapper = await mountSuspended(MTabs, {
      props: { items, modelValue: 'one' },
    })

    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })

    const events = wrapper.emitted('update:modelValue')
    expect(events!.at(-1)).toEqual(['two'])
  })

  it('renders only the active panel as a tabpanel', async () => {
    const Host = defineComponent({
      render: () => h(MTabs, { items, modelValue: 'one' }, {
        panels: () => [
          h(MTabPanel, { value: 'one' }, () => 'Panel one'),
          h(MTabPanel, { value: 'two' }, () => 'Panel two'),
        ],
      }),
    })

    const wrapper = await mountSuspended(Host)

    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels).toHaveLength(1)
    expect(panels[0]!.text()).toBe('Panel one')
    expect(panels[0]!.attributes('aria-labelledby')).toBeTruthy()
  })
})
