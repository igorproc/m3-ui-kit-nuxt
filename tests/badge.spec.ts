import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MBadge from '../app/components/ui/badge/index.vue'

describe('m-badge', () => {
  it('renders a status role with the large modifier by default', async () => {
    const wrapper = await mountSuspended(MBadge, { props: { value: 5 } })

    expect(wrapper.classes()).toContain('ui-badge')
    expect(wrapper.classes()).toContain('ui-badge--large')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('renders the numeric value in the label', async () => {
    const wrapper = await mountSuspended(MBadge, { props: { value: 5 } })

    expect(wrapper.find('.ui-badge__label').text()).toBe('5')
  })

  it('clamps the value to `${max}+` when it exceeds max', async () => {
    const wrapper = await mountSuspended(MBadge, {
      props: { value: 150, max: 99 },
    })

    expect(wrapper.find('.ui-badge__label').text()).toBe('99+')
  })

  it('respects a custom max threshold', async () => {
    const wrapper = await mountSuspended(MBadge, {
      props: { value: 12, max: 9 },
    })

    expect(wrapper.find('.ui-badge__label').text()).toBe('9+')
  })

  it('renders the dot variant without a label', async () => {
    const wrapper = await mountSuspended(MBadge, {
      props: { dot: true, value: 5 },
    })

    expect(wrapper.classes()).toContain('ui-badge--small')
    expect(wrapper.classes()).not.toContain('ui-badge--large')
    expect(wrapper.find('.ui-badge__label').exists()).toBe(false)
  })

  it('omits the label when value is empty', async () => {
    const wrapper = await mountSuspended(MBadge)

    expect(wrapper.find('.ui-badge__label').exists()).toBe(false)
  })

  it('renders non-numeric string values verbatim', async () => {
    const wrapper = await mountSuspended(MBadge, { props: { value: 'new' } })

    expect(wrapper.find('.ui-badge__label').text()).toBe('new')
  })

  it('prefers the default slot over the value', async () => {
    const wrapper = await mountSuspended(MBadge, {
      props: { value: 5 },
      slots: { default: () => 'X' },
    })

    expect(wrapper.find('.ui-badge__label').text()).toBe('X')
  })
})
