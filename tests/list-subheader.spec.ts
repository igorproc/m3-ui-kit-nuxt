import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MListSubheader from '../app/components/ui/list/subheader/index.vue'

describe('MListSubheader', () => {
  it('renders a passive div label from the title prop', async () => {
    const wrapper = await mountSuspended(MListSubheader, { props: { title: 'Recent' } })
    const root = wrapper.find('.ui-list-subheader')
    expect(root.element.tagName).toBe('DIV')
    expect(root.text()).toBe('Recent')
    // Passive: no interactive role, no tab stop.
    expect(root.attributes('role')).toBeUndefined()
    expect(root.attributes('tabindex')).toBeUndefined()
    expect(root.classes()).not.toContain('ui-list-subheader--sticky')
    expect(root.classes()).not.toContain('ui-list-subheader--inset')
  })

  it('prefers the default slot over the title prop', async () => {
    const wrapper = await mountSuspended(MListSubheader, {
      props: { title: 'prop title' },
      slots: { default: () => 'slot title' },
    })
    expect(wrapper.find('.ui-list-subheader').text()).toBe('slot title')
  })

  it('keeps a slotted heading inside the subheader semantics', async () => {
    const wrapper = await mountSuspended(MListSubheader, {
      slots: { default: () => h('h3', 'Archive') },
    })
    expect(wrapper.find('.ui-list-subheader > h3').text()).toBe('Archive')
  })

  it('supports the li and p tags for the consumer markup', async () => {
    const wrapper = await mountSuspended(MListSubheader, { props: { tag: 'li', title: 'Recent' } })
    expect(wrapper.find('.ui-list-subheader').element.tagName).toBe('LI')

    await wrapper.setProps({ tag: 'p' })
    expect(wrapper.find('.ui-list-subheader').element.tagName).toBe('P')
  })

  it('applies the sticky and inset modifiers', async () => {
    const wrapper = await mountSuspended(MListSubheader, { props: { title: 'Archive', sticky: true, inset: true } })
    expect(wrapper.find('.ui-list-subheader').classes()).toEqual(
      expect.arrayContaining(['ui-list-subheader--sticky', 'ui-list-subheader--inset']),
    )
  })

  it('renders no misleading label when title and slot are absent', async () => {
    const wrapper = await mountSuspended(MListSubheader)
    expect(wrapper.find('.ui-list-subheader').text()).toBe('')
  })
})
