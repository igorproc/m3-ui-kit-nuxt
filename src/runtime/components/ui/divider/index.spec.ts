import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MDivider from './index.vue'
import MList from '../list/index.vue'

const inList = (listAttrs: Record<string, unknown>) =>
  mountSuspended(defineComponent({ render: () => h(MList, listAttrs, { default: () => h(MDivider) }) }))

describe('m-divider', () => {
  it('renders a horizontal separator by default', async () => {
    const wrapper = await mountSuspended(MDivider)

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-divider')
    expect(wrapper.classes()).toContain('ui-divider--horizontal')
    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
  })

  it('maps the orientation prop to a modifier class and aria-orientation', async () => {
    const wrapper = await mountSuspended(MDivider, {
      props: { orientation: 'vertical' },
    })

    expect(wrapper.classes()).toContain('ui-divider--vertical')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it.each(['start', 'center', 'end'] as const)('applies the %s inset', async (inset) => {
    const wrapper = await mountSuspended(MDivider, { props: { inset } })

    expect(wrapper.classes()).toContain(`ui-divider--inset-${inset}`)
  })

  it('runs the full length without an inset', async () => {
    const wrapper = await mountSuspended(MDivider)

    expect(wrapper.classes().some(name => name.startsWith('ui-divider--inset'))).toBe(false)
  })

  it('is a decorative li inside a list', async () => {
    const wrapper = await inList({})
    const divider = wrapper.find('.ui-divider')

    expect(divider.element.tagName).toBe('LI')
    expect(divider.attributes('aria-hidden')).toBe('true')
    expect(divider.attributes('role')).toBeUndefined()
    expect(divider.attributes('aria-orientation')).toBeUndefined()
  })

  it('is a decorative div inside a list that carries a role', async () => {
    const wrapper = await inList({ role: 'listbox' })
    const divider = wrapper.find('.ui-divider')

    expect(divider.element.tagName).toBe('DIV')
    expect(divider.attributes('aria-hidden')).toBe('true')
    expect(divider.attributes('role')).toBeUndefined()
  })
})
