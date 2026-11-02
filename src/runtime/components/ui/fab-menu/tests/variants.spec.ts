import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import MFabMenu from '../index.vue'
import type { MFabMenuItem } from '../props'

type Slots = Record<string, (...args: never[]) => unknown>

const items: MFabMenuItem[] = [
  { label: 'Share', icon: 'ic:baseline-share', value: 'share' },
  { label: 'Edit', icon: 'ic:baseline-edit', value: 'edit' },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Slots) {
  if (current) current.unmount()
  current = await mountSuspended(MFabMenu, { props: { items, ariaLabel: 'Create', ...props }, slots })

  return current as VueWrapper
}

async function open(wrapper: VueWrapper) {
  await wrapper.find('.ui-fab-menu__activator').trigger('click')
  await nextTick()
}

const glyphs = (wrapper: VueWrapper) => wrapper.findAll('.ui-fab-menu__icon').map(icon => icon.findComponent({ name: 'MIcon' }).props('name'))

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-fab-menu · variants', () => {
  describe('align', () => {
    it.each(['start', 'end'] as const)('maps %s onto its modifier', async (align) => {
      const wrapper = await mount({ align })

      expect(wrapper.classes()).toContain(`ui-fab-menu--${align}`)
    })

    it('defaults to end', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-fab-menu--end')
    })

    it.each(['start', 'end'] as const)('lines the actions of align=%s up on that logical edge', async (align) => {
      const wrapper = await mount({ align })

      await open(wrapper)

      expect(wrapper.find('.ui-fab-menu__drawer').classes()).toContain(`ui-fab-menu__drawer--${align}`)
    })

    // The stylesheet mirrors the logical edge (`:dir(rtl)`), and the popover resolves the
    // logical placement against the FAB, so nothing is read from the layout in script.
    it('keeps the edge logical in a right-to-left layout', async () => {
      const host = document.createElement('div')
      host.style.direction = 'rtl'
      document.body.append(host)
      current?.unmount()
      current = await mountSuspended(MFabMenu, { props: { items, ariaLabel: 'Create' }, attachTo: host })
      const wrapper = current as VueWrapper

      await open(wrapper)

      expect(wrapper.find('.ui-fab-menu__drawer').classes()).toContain('ui-fab-menu__drawer--end')
      wrapper.unmount()
      current = null
      host.remove()
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps %s onto the root and the FAB', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-fab-menu--${color}`)
      expect(wrapper.find('button.ui-fab').classes()).toContain(`ui-fab--${color}`)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-fab-menu--primary')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('passes %s to the FAB', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.find('button.ui-fab').classes()).toContain(`ui-fab--${density}`)
    })

    it('defaults to the default step on the role container', async () => {
      const wrapper = await mount()

      expect(wrapper.find('button.ui-fab').classes()).toEqual(expect.arrayContaining(['ui-fab--default', 'ui-fab--tonal']))
    })
  })

  describe('FAB', () => {
    it('keeps both glyphs mounted, open first, and crosses them by state', async () => {
      const wrapper = await mount()

      expect(glyphs(wrapper)).toEqual([ICONS.add, ICONS.close])
      await open(wrapper)
      expect(glyphs(wrapper)).toEqual([ICONS.add, ICONS.close])
      expect(wrapper.find('.ui-fab-menu__activator').classes()).toContain('ui-fab-menu__activator--open')
    })

    it('takes its own open and close glyphs', async () => {
      const wrapper = await mount({ openIcon: 'ic:baseline-edit', closeIcon: 'ic:baseline-clear' })

      expect(glyphs(wrapper)).toEqual(['ic:baseline-edit', 'ic:baseline-clear'])
    })

    it('carries no open modifier while closed', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-fab-menu__activator').classes()).not.toContain('ui-fab-menu__activator--open')
    })
  })

  describe('actions', () => {
    it('renders no drawer while closed', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-fab-menu__drawer').exists()).toBe(false)
    })

    it('renders one pill per item, icon first, and the open class on the drawer', async () => {
      const wrapper = await mount()

      await open(wrapper)
      const actions = wrapper.findAll('.ui-fab-menu__item')

      expect(actions.map(action => action.find('.ui-fab-menu__label').text())).toEqual(['Share', 'Edit'])
      expect(actions.every(action => action.element.firstElementChild?.classList.contains('ui-fab-menu__item-icon'))).toBe(true)
      expect(wrapper.find('.ui-fab-menu__drawer').classes()).toContain('ui-fab-menu__drawer--open')
    })

    it('renders an action without an icon box when its item has none', async () => {
      const wrapper = await mount({ items: [{ label: 'Archive', value: 'archive' }] })

      await open(wrapper)

      expect(wrapper.find('.ui-fab-menu__item-icon').exists()).toBe(false)
    })

    it('cascades the actions nearest-first in and farthest-first out', async () => {
      const wrapper = await mount()

      await open(wrapper)
      const entries = wrapper.findAll('.ui-fab-menu__entry').map(entry => (entry.element as HTMLElement).style)

      expect(entries.map(style => style.getPropertyValue('--ui-fab-enter'))).toEqual(['1', '0'])
      expect(entries.map(style => style.getPropertyValue('--ui-fab-leave'))).toEqual(['0', '1'])
    })
  })

  describe('slots', () => {
    it('replaces the FAB with the activator slot', async () => {
      const wrapper = await mount({}, { activator: ({ isOpen }: { isOpen: boolean }) => h('button', { class: 'own' }, isOpen ? 'Close' : 'Open') })

      expect(wrapper.find('button.ui-fab').exists()).toBe(false)
      expect(wrapper.find('.own').text()).toBe('Open')
    })

    it('replaces the default actions with the default slot', async () => {
      const wrapper = await mount({}, { default: () => h('p', { class: 'own-content' }, 'Custom') })

      await open(wrapper)

      expect(wrapper.find('.own-content').text()).toBe('Custom')
      expect(wrapper.find('.ui-fab-menu__list').exists()).toBe(false)
    })
  })
})
