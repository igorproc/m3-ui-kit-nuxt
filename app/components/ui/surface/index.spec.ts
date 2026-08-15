import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSurface from './index.vue'

describe('m-surface', () => {
  it('renders a <div> with the plain/none preset by default', async () => {
    const wrapper = await mountSuspended(MSurface)

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-surface')
    expect(wrapper.classes()).toContain('ui-surface--plain')
    expect(wrapper.classes()).toContain('ui-surface--shape-none')
  })

  it('maps each surface preset to a modifier class', async () => {
    for (const variant of ['plain', 'filled', 'elevated', 'outlined'] as const) {
      const wrapper = await mountSuspended(MSurface, { props: { variant } })
      expect(wrapper.classes()).toContain(`ui-surface--${variant}`)
    }
  })

  it('maps each system shape token to a modifier class', async () => {
    for (const shape of ['extra-small', 'medium', 'large', 'full'] as const) {
      const wrapper = await mountSuspended(MSurface, { props: { shape } })
      expect(wrapper.classes()).toContain(`ui-surface--shape-${shape}`)
    }
  })

  it('renders on a custom semantic tag', async () => {
    const wrapper = await mountSuspended(MSurface, { props: { tag: 'section' } })

    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('renders the default slot content', async () => {
    const wrapper = await mountSuspended(MSurface, {
      slots: { default: () => 'Body' },
    })

    expect(wrapper.text()).toBe('Body')
  })

  it('passes native attributes through to the root via fallthrough', async () => {
    const wrapper = await mountSuspended(MSurface, {
      attrs: { 'data-test': 'panel', 'aria-label': 'Panel' },
    })

    expect(wrapper.attributes('data-test')).toBe('panel')
    expect(wrapper.attributes('aria-label')).toBe('Panel')
  })

  it('does not add role, tabindex or interaction state classes', async () => {
    const wrapper = await mountSuspended(MSurface)

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
})
