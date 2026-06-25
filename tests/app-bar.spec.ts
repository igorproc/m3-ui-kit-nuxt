import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MAppBar from '../app/components/ui/app-bar/index.vue'

describe('m-app-bar', () => {
  it('renders the bar with the default center-aligned type', async () => {
    const wrapper = await mountSuspended(MAppBar)

    expect(wrapper.find('.ui-app-bar').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-app-bar--center-aligned')
  })

  it('maps the new `type` prop to a modifier class', async () => {
    for (const type of ['center-aligned', 'small', 'medium', 'large'] as const) {
      const wrapper = await mountSuspended(MAppBar, { props: { type } })
      expect(wrapper.classes()).toContain(`ui-app-bar--${type}`)
    }
  })

  it('renders the title prop into the title text element', async () => {
    const wrapper = await mountSuspended(MAppBar, { props: { title: 'Inbox' } })

    expect(wrapper.find('.ui-app-bar__title-text').text()).toBe('Inbox')
  })

  it('adds the with-subtitle modifier when a subtitle is provided', async () => {
    const wrapper = await mountSuspended(MAppBar, {
      props: { title: 'Inbox', subtitle: 'unread' },
    })

    expect(wrapper.classes()).toContain('ui-app-bar--with-subtitle')
    expect(wrapper.find('.ui-app-bar__subtitle').text()).toBe('unread')
  })

  it('renders nav and actions slots only when provided', async () => {
    const bare = await mountSuspended(MAppBar, { props: { title: 'X' } })
    expect(bare.find('.ui-app-bar__nav').exists()).toBe(false)
    expect(bare.find('.ui-app-bar__actions').exists()).toBe(false)

    const withSlots = await mountSuspended(MAppBar, {
      props: { title: 'X' },
      slots: {
        nav: () => 'N',
        actions: () => 'A',
      },
    })
    expect(withSlots.find('.ui-app-bar__nav').text()).toBe('N')
    expect(withSlots.find('.ui-app-bar__actions').text()).toBe('A')
  })

  it('reflects the deprecated isScrolled override as the scrolled class', async () => {
    const wrapper = await mountSuspended(MAppBar, { props: { isScrolled: true } })

    expect(wrapper.classes()).toContain('ui-app-bar--scrolled')
  })
})
