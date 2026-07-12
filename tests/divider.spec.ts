import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MDivider from '../app/components/ui/divider/index.vue'

describe('m-divider', () => {
  it('renders a horizontal separator by default', async () => {
    const wrapper = await mountSuspended(MDivider)

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

  it('applies the inset modifier when inset is true (new boolean API)', async () => {
    const wrapper = await mountSuspended(MDivider, {
      props: { inset: true },
    })

    expect(wrapper.classes()).toContain('ui-divider--inset')
  })

  it('omits the inset modifier by default', async () => {
    const wrapper = await mountSuspended(MDivider)

    expect(wrapper.classes()).not.toContain('ui-divider--inset')
  })
})
