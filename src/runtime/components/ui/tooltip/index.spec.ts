import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import MTooltip from './index.vue'

describe('m-tooltip', () => {
  // Teleported content is appended to <body>; clear leftovers between cases so
  // queries never match a stale node from a previous mount.
  afterEach(() => {
    document.querySelectorAll('.ui-tooltip__content').forEach(node => node.remove())
  })

  it('renders the trigger slot and hides the tooltip content initially', async () => {
    const wrapper = await mountSuspended(MTooltip, {
      props: { text: 'Hint' },
      slots: { default: () => 'Trigger' },
    })

    expect(wrapper.find('.ui-tooltip__trigger').text()).toBe('Trigger')
    // Content is teleported to body and rendered only while visible.
    expect(document.querySelector('.ui-tooltip__content')).toBeNull()
    expect(wrapper.find('.ui-tooltip__trigger').attributes('aria-describedby')).toBeUndefined()
  })

  it('shows tooltip content with role="tooltip" on mouseenter', async () => {
    const wrapper = await mountSuspended(MTooltip, {
      props: { text: 'Hint' },
      slots: { default: () => 'Trigger' },
    })

    await wrapper.trigger('mouseenter')

    const content = document.querySelector('.ui-tooltip__content')
    expect(content).not.toBeNull()
    expect(content!.getAttribute('role')).toBe('tooltip')
    expect(content!.textContent).toContain('Hint')

    await wrapper.trigger('mouseleave')
    expect(document.querySelector('.ui-tooltip__content')).toBeNull()
  })

  it('wires aria-describedby from the trigger to the tooltip id while visible', async () => {
    const wrapper = await mountSuspended(MTooltip, {
      props: { text: 'Hint' },
      slots: { default: () => 'Trigger' },
    })

    await wrapper.trigger('mouseenter')

    const describedBy = wrapper.find('.ui-tooltip__trigger').attributes('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.querySelector('.ui-tooltip__content')!.id).toBe(describedBy)
  })

  it('opens on focusin and closes on focusout', async () => {
    const wrapper = await mountSuspended(MTooltip, {
      props: { text: 'Hint' },
      slots: { default: () => 'Trigger' },
    })

    await wrapper.trigger('focusin')
    expect(document.querySelector('.ui-tooltip__content')).not.toBeNull()

    await wrapper.trigger('focusout')
    expect(document.querySelector('.ui-tooltip__content')).toBeNull()
  })

  it('dismisses on Escape (APG tooltip pattern)', async () => {
    const wrapper = await mountSuspended(MTooltip, {
      props: { text: 'Hint' },
      slots: { default: () => 'Trigger' },
    })

    await wrapper.trigger('mouseenter')
    expect(document.querySelector('.ui-tooltip__content')).not.toBeNull()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(document.querySelector('.ui-tooltip__content')).toBeNull()
  })

  it('renders a custom content slot over the text prop', async () => {
    const wrapper = await mountSuspended(MTooltip, {
      props: { text: 'Hint' },
      slots: {
        default: () => 'Trigger',
        content: () => 'Custom',
      },
    })

    await wrapper.trigger('mouseenter')

    expect(document.querySelector('.ui-tooltip__content')!.textContent).toContain('Custom')
  })
})
