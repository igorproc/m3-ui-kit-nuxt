import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { useOverlayHost } from '#kit/components/ui/overlay/tests/helpers'
import MNavigationDrawer from '../index.vue'
import type { MNavigationDrawerItem } from '../props'
import { drawerDialog, mountDrawer } from './helpers'

useOverlayHost()

const items: MNavigationDrawerItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox', badge: 24, badgeLabel: '24 unread', section: 'Mail' },
  { id: 'sent', icon: 'outline-send', label: 'Sent', section: 'Mail' },
  { id: 'family', icon: 'outline-label', label: 'Family', section: 'Labels' },
  { id: 'trash', label: 'Trash', disabled: true },
]

const destinations = () => Array.from(drawerDialog()!.querySelectorAll<HTMLButtonElement>('.ui-navigation-item'))

// W62-В: the drawer draws its destinations with the shared navigation item.
describe('m-navigation-drawer · destinations', () => {
  describe('variants', () => {
    it('draws every destination as a drawer item with its pill on the whole row', async () => {
      await mountDrawer({ items })

      expect(destinations()).toHaveLength(4)
      expect(destinations().every(item => item.classList.contains('ui-navigation-item--drawer'))).toBe(true)
      expect(destinations().every(item => item.classList.contains('ui-navigation-item--start'))).toBe(true)
      expect(destinations().map(item => item.querySelector('.ui-navigation-item__label')!.textContent!.trim())).toEqual(['Inbox', 'Sent', 'Family', 'Trash'])
    })

    it('heads each section with its name and separates sections with a divider', async () => {
      await mountDrawer({ items })
      const nav = drawerDialog()!.querySelector('.ui-navigation-drawer__nav')!

      expect(Array.from(nav.querySelectorAll('.ui-navigation-drawer__section')).map(section => section.textContent!.trim())).toEqual(['Mail', 'Labels'])
      expect(nav.querySelectorAll('.ui-navigation-drawer__divider')).toHaveLength(2)
    })

    it('draws no section heading or divider for a flat list', async () => {
      await mountDrawer({ items: items.map(({ section: _section, ...item }) => item) })
      const nav = drawerDialog()!.querySelector('.ui-navigation-drawer__nav')!

      expect(nav.querySelector('.ui-navigation-drawer__section')).toBeNull()
      expect(nav.querySelector('.ui-navigation-drawer__divider')).toBeNull()
    })

    it('shows the badge as trailing text', async () => {
      await mountDrawer({ items })

      expect(destinations()[0]!.querySelector('.ui-navigation-item__trailing')!.textContent!.trim()).toBe('24')
    })

    it('puts the destinations before the default slot content', async () => {
      await mountDrawer({ items }, { default: () => h('p', { class: 'extra' }, 'Footer') })
      const content = drawerDialog()!.querySelector('.ui-navigation-drawer__content')!

      expect(content.firstElementChild!.classList.contains('ui-navigation-drawer__nav')).toBe(true)
      expect(content.lastElementChild!.classList.contains('extra')).toBe(true)
    })

    it('renders no destination list without items', async () => {
      await mountDrawer()

      expect(drawerDialog()!.querySelector('.ui-navigation-drawer__nav')).toBeNull()
    })

    it('fills the glyph of the current destination', async () => {
      await mountDrawer({ items, current: 'sent' })

      expect(destinations()[1]!.innerHTML).toContain('ic:baseline-send')
    })
  })

  describe('interaction', () => {
    it('writes the chosen destination to v-model:current and reports every activation', async () => {
      const { wrapper } = await mountDrawer({ items, current: 'inbox' })
      const drawer = wrapper.findComponent(MNavigationDrawer)

      destinations()[1]!.click()
      await nextTick()
      destinations()[0]!.click()
      await nextTick()

      expect(drawer.emitted('update:current')!.map(([id]: unknown[]) => id)).toEqual(['sent', 'inbox'])
      expect(drawer.emitted('select')!.map(([id]: unknown[]) => id)).toEqual(['sent', 'inbox'])
    })

    it('does not choose a disabled destination', async () => {
      const { wrapper } = await mountDrawer({ items })

      destinations()[3]!.click()
      await nextTick()

      expect(wrapper.findComponent(MNavigationDrawer).emitted('select')).toBeUndefined()
    })
  })

  describe('a11y', () => {
    it('lists the destinations in a nav inside the dialog', async () => {
      await mountDrawer({ items })

      expect(drawerDialog()!.querySelector('.ui-navigation-drawer__nav')!.tagName).toBe('NAV')
    })

    it('marks the current destination aria-current="page"', async () => {
      await mountDrawer({ items, current: 'family' })

      expect(destinations().map(item => item.getAttribute('aria-current'))).toEqual([null, null, 'page', null])
    })

    it('keeps the trailing count out of the name and reads badgeLabel after it', async () => {
      await mountDrawer({ items })
      const inbox = destinations()[0]!

      expect(inbox.querySelector('.ui-navigation-item__trailing')!.getAttribute('aria-hidden')).toBe('true')
      expect(drawerDialog()!.querySelector(`#${inbox.getAttribute('aria-describedby')}`)!.textContent!.trim()).toBe('24 unread')
    })

    it('names each section group by its heading', async () => {
      await mountDrawer({ items })
      const groups = Array.from(drawerDialog()!.querySelectorAll('.ui-navigation-drawer__group'))

      for (const group of groups.filter(node => node.querySelector('.ui-navigation-drawer__section'))) {
        expect(group.getAttribute('role')).toBe('group')
        expect(group.querySelector(`#${group.getAttribute('aria-labelledby')}`)!.classList.contains('ui-navigation-drawer__section')).toBe(true)
      }
    })

    it('disables a disabled destination natively', async () => {
      await mountDrawer({ items })

      expect(destinations()[3]!.disabled).toBe(true)
    })
  })
})
