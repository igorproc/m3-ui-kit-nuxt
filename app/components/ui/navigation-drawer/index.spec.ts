import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MNavigationDrawer from './index.vue'

// vue-final-modal teleports its surface into document.body; assertions target
// the global document, and the closed/open state is driven by `modelValue`.
describe('m-navigation-drawer', () => {
  it('mounts without rendering surface content while closed', async () => {
    await mountSuspended(MNavigationDrawer, {
      props: { modelValue: false },
      slots: { default: () => 'drawer body' },
    })

    expect(document.body.textContent).not.toContain('drawer body')
  })

  it('renders the surface and slot content when open', async () => {
    await mountSuspended(MNavigationDrawer, {
      props: { modelValue: true },
      slots: { default: () => 'drawer body' },
    })

    expect(document.querySelector('.ui-navigation-drawer__content')).not.toBeNull()
    expect(document.body.textContent).toContain('drawer body')
  })

  it('applies the side modifier class (default left)', async () => {
    await mountSuspended(MNavigationDrawer, {
      props: { modelValue: true },
      slots: { default: () => 'x' },
    })

    expect(document.querySelector('.ui-navigation-drawer--left')).not.toBeNull()
  })

  it('applies the right side modifier when side is right', async () => {
    await mountSuspended(MNavigationDrawer, {
      props: { modelValue: true, side: 'right' },
      slots: { default: () => 'x' },
    })

    expect(document.querySelector('.ui-navigation-drawer--right')).not.toBeNull()
  })

  it('renders a header region with an accessible name from the header slot', async () => {
    await mountSuspended(MNavigationDrawer, {
      props: { modelValue: true },
      slots: { header: () => 'Menu', default: () => 'body' },
    })

    const header = document.querySelector('.ui-navigation-drawer__header')
    expect(header).not.toBeNull()
    expect(header!.textContent).toContain('Menu')
  })
})
