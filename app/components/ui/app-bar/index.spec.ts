import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MAppBar from './index.vue'
import MAppBarNav from './nav/index.vue'
import MAppBarTitle from './title/index.vue'
import MAppBarActions from './actions/index.vue'

describe('m-app-bar', () => {
  it('renders with the default small size and start alignment', async () => {
    const wrapper = await mountSuspended(MAppBar)
    const bar = wrapper.find('.ui-app-bar')

    expect(bar.exists()).toBe(true)
    expect(bar.classes()).toContain('ui-app-bar--small')
    expect(bar.classes()).not.toContain('ui-app-bar--center')
  })

  it('normalizes the deprecated center-aligned alias to small + center', async () => {
    const wrapper = await mountSuspended(MAppBar, { props: { type: 'center-aligned' } })
    const bar = wrapper.find('.ui-app-bar')

    expect(bar.classes()).toContain('ui-app-bar--small')
    expect(bar.classes()).toContain('ui-app-bar--center')
  })

  it('exposes size and alignment as independent axes', async () => {
    for (const type of ['small', 'medium', 'large'] as const) {
      const wrapper = await mountSuspended(MAppBar, { props: { type, align: 'center' } })
      const bar = wrapper.find('.ui-app-bar')

      expect(bar.classes()).toContain(`ui-app-bar--${type}`)
      expect(bar.classes()).toContain('ui-app-bar--center')
    }
  })

  it('renders ready-made title/subtitle props and flags the subtitle', async () => {
    const wrapper = await mountSuspended(MAppBar, {
      props: { title: 'Inbox', subtitle: 'unread' },
    })

    expect(wrapper.find('.ui-app-bar__title').text()).toBe('Inbox')
    expect(wrapper.find('.ui-app-bar__subtitle').text()).toBe('unread')
    expect(wrapper.find('.ui-app-bar').classes()).toContain('ui-app-bar--subtitle')
  })

  it('reflects subtitle presence reported by a composed MAppBarTitle', async () => {
    const wrapper = await mountSuspended(MAppBar, {
      slots: { default: () => h(MAppBarTitle, { title: 'X', subtitle: 'Y' }) },
    })

    expect(wrapper.find('.ui-app-bar').classes()).toContain('ui-app-bar--subtitle')
    expect(wrapper.find('.ui-app-bar__subtitle').text()).toBe('Y')
  })

  it('places compound nav and actions children', async () => {
    const wrapper = await mountSuspended(MAppBar, {
      slots: {
        default: () => [
          h(MAppBarNav, null, { default: () => 'N' }),
          h(MAppBarTitle, { title: 'T' }),
          h(MAppBarActions, null, { default: () => 'A' }),
        ],
      },
    })

    expect(wrapper.find('.ui-app-bar__nav').text()).toBe('N')
    expect(wrapper.find('.ui-app-bar__actions').text()).toBe('A')
  })

  it('controls the scroll-fill state via the scrolled prop', async () => {
    const on = await mountSuspended(MAppBar, { props: { scrolled: true } })
    expect(on.find('.ui-app-bar').classes()).toContain('ui-app-bar--scrolled')

    const off = await mountSuspended(MAppBar, { props: { scrolled: false } })
    expect(off.find('.ui-app-bar').classes()).not.toContain('ui-app-bar--scrolled')
  })
})
