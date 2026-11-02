import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import type { Component } from 'vue'
import MTabs from '../index.vue'
import MTab from '../tab/index.vue'
import MTabPanel from '../panel/index.vue'
import type { MTabItem } from '../props'

const items: MTabItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three', disabled: true },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTabs, { props: { items, ariaLabel: 'Sections', ...props }, slots })

  return current as VueWrapper
}

async function mountHost(component: Component, options: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(component, options)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-tabs · variants', () => {
  describe('items', () => {
    it('renders one tab per item inside the list', async () => {
      const wrapper = await mount()
      const list = wrapper.find('.ui-tabs__list')

      expect(list.findAll('.ui-tabs__tab')).toHaveLength(3)
      expect(list.findAll('.ui-tabs__tab-label').map(label => label.text())).toEqual(['One', 'Two', 'Three'])
    })

    it('renders an empty list without items', async () => {
      const wrapper = await mount({ items: undefined })

      expect(wrapper.find('.ui-tabs__list').exists()).toBe(true)
      expect(wrapper.findAll('.ui-tabs__tab')).toHaveLength(0)
    })

    it.each([
      ['label only', { value: 'a', label: 'Inbox' }, false, 'Inbox'],
      ['icon and label', { value: 'a', label: 'Inbox', icon: 'home' }, true, 'Inbox'],
    ] as const)('renders a tab with %s', async (_, item, hasIcon, label) => {
      const wrapper = await mount({ items: [item] })
      const tab = wrapper.find('.ui-tabs__tab')

      expect(tab.find('.ui-tabs__tab-icon').exists()).toBe(hasIcon)
      expect(tab.find('.ui-tabs__tab-label').text()).toBe(label)
    })

    it('keeps the icon before the label', async () => {
      const wrapper = await mount({ items: [{ value: 'a', label: 'Inbox', icon: 'home' }] })
      const parts = wrapper.find('.ui-tabs__tab-content').element.children

      expect(parts[0]!.classList.contains('ui-tabs__tab-icon')).toBe(true)
      expect(parts[1]!.classList.contains('ui-tabs__tab-label')).toBe(true)
    })
  })

  describe('state modifiers', () => {
    it('marks the selected tab active and no other', async () => {
      const wrapper = await mount({ modelValue: 'two' })
      const tabs = wrapper.findAll('.ui-tabs__tab')

      expect(tabs.map(tab => tab.classes().includes('ui-tabs__tab--active'))).toEqual([false, true, false])
    })

    it('marks a disabled tab with its modifier', async () => {
      const wrapper = await mount()
      const tabs = wrapper.findAll('.ui-tabs__tab')

      expect(tabs.map(tab => tab.classes().includes('ui-tabs__tab--disabled'))).toEqual([false, false, true])
    })
  })

  describe('element', () => {
    it('renders a tab without a route as a button', async () => {
      const wrapper = await mount()
      const tab = wrapper.find('.ui-tabs__tab')

      expect(tab.element.tagName).toBe('BUTTON')
      expect(tab.attributes('type')).toBe('button')
    })
  })

  describe('slots', () => {
    it('appends slotted tabs after the item tabs in the same list', async () => {
      const wrapper = await mount({ items: [items[0]!] }, {
        tabs: () => [h(MTab, { value: 'extra', label: 'Extra' })],
      })

      expect(wrapper.find('.ui-tabs__list').findAll('.ui-tabs__tab-label').map(label => label.text())).toEqual(['One', 'Extra'])
    })

    it('renders the default slot of a tab in place of its label', async () => {
      const wrapper = await mountHost(defineComponent({
        render: () => h(MTabs, { ariaLabel: 'Sections' }, {
          tabs: () => [h(MTab, { value: 'a', label: 'Plain' }, () => h('strong', { class: 'custom' }, 'Rich'))],
        }),
      }))

      expect(wrapper.find('.ui-tabs__tab-label .custom').text()).toBe('Rich')
      expect(wrapper.find('.ui-tabs__tab-label').text()).not.toContain('Plain')
    })

    it('renders only the active panel from the panels slot', async () => {
      const wrapper = await mountHost(defineComponent({
        render: () => h(MTabs, { items, modelValue: 'one', ariaLabel: 'Sections' }, {
          panels: () => [
            h(MTabPanel, { value: 'one' }, () => 'Panel one'),
            h(MTabPanel, { value: 'two' }, () => 'Panel two'),
          ],
        }),
      }))
      const panels = wrapper.findAll('.ui-tabs__content')

      expect(panels).toHaveLength(1)
      expect(panels[0]!.text()).toBe('Panel one')
    })

    it('renders the default slot as one panel scoped to the selected value', async () => {
      const wrapper = await mount({ modelValue: 'two' }, {
        default: ({ value }: { value: string | number | null }) => `Panel ${value}`,
      })

      expect(wrapper.findAll('.ui-tabs__content')).toHaveLength(1)
      expect(wrapper.find('.ui-tabs__content').text()).toBe('Panel two')
    })

    it('renders no panel without a panel slot', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-tabs__content').exists()).toBe(false)
    })

    it('puts the panels after the tablist', async () => {
      const wrapper = await mount({}, { default: () => 'Body' })
      const children = Array.from((wrapper.element as HTMLElement).children)

      expect(children[0]!.classList.contains('ui-tabs__list')).toBe(true)
      expect(children.at(-1)!.classList.contains('ui-tabs__content')).toBe(true)
    })
  })
  // W53-А: the M3 primary / secondary axis is `hierarchy`.
  describe('hierarchy', () => {
    it.each(['primary', 'secondary'] as const)('marks the list and every tab %s', async (hierarchy) => {
      const wrapper = await mount({ hierarchy })

      expect(wrapper.find('.ui-tabs__list').classes()).toContain(`ui-tabs__list--${hierarchy}`)
      expect(wrapper.findAll('.ui-tabs__tab').every(tab => tab.classes().includes(`ui-tabs__tab--${hierarchy}`))).toBe(true)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-tabs__list').classes()).toContain('ui-tabs__list--primary')
    })

    it('carries the hierarchy to slotted tabs', async () => {
      const wrapper = await mount({ items: [], hierarchy: 'secondary' }, {
        tabs: () => [h(MTab, { value: 'a', label: 'A' })],
      })

      expect(wrapper.find('.ui-tabs__tab').classes()).toContain('ui-tabs__tab--secondary')
    })
  })

  // W54-А: `fixed` (equal shares, scrolls as a safety net) or `scrollable`.
  describe('layout', () => {
    it.each([
      ['fixed', false],
      ['scrollable', true],
    ] as const)('layout=%s marks the list scrollable: %s', async (layout, scrollable) => {
      const wrapper = await mount({ layout })

      expect(wrapper.find('.ui-tabs__list').classes().includes('ui-tabs__list--scrollable')).toBe(scrollable)
    })

    it('defaults to fixed', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-tabs__list').classes()).not.toContain('ui-tabs__list--scrollable')
    })
  })

  describe('icon placement', () => {
    const iconTab = [{ value: 'a', label: 'Inbox', icon: 'home' }]

    it.each([
      ['primary', 'top'],
      ['secondary', 'start'],
    ] as const)('a %s tab puts its icon %s by default', async (hierarchy, placement) => {
      const wrapper = await mount({ items: iconTab, hierarchy })

      expect(wrapper.find('.ui-tabs__tab').classes()).toContain(`ui-tabs__tab--icon-${placement}`)
    })

    it.each(['top', 'start'] as const)('iconPlacement=%s overrides the default', async (iconPlacement) => {
      const wrapper = await mount({ items: iconTab, hierarchy: 'secondary', iconPlacement })

      expect(wrapper.find('.ui-tabs__tab').classes()).toContain(`ui-tabs__tab--icon-${iconPlacement}`)
    })

    it.each([
      ['an icon over a label', iconTab, {}, true],
      ['an icon beside a label', iconTab, { iconPlacement: 'start' }, false],
      ['a label alone', [{ value: 'a', label: 'Inbox' }], {}, false],
    ] as const)('is the tall stacked tab only for %s', async (_, tabs, props, stacked) => {
      const wrapper = await mount({ items: tabs, ...props })

      expect(wrapper.find('.ui-tabs__tab').classes().includes('ui-tabs__tab--stacked')).toBe(stacked)
    })

    it('wraps the icon and the label in one content box', async () => {
      const wrapper = await mount({ items: iconTab })
      const content = wrapper.find('.ui-tabs__tab-content')

      expect(content.find('.ui-tabs__tab-icon').exists()).toBe(true)
      expect(content.find('.ui-tabs__tab-label').text()).toBe('Inbox')
    })
  })

  describe('badge', () => {
    it.each([
      ['a count', 3, 'ui-badge--large'],
      ['a dot', true, 'ui-badge--small'],
    ] as const)('renders %s', async (_, badge, modifier) => {
      const wrapper = await mount({ items: [{ value: 'a', label: 'Inbox', badge, badgeLabel: 'New' }] })
      const shown = wrapper.find('.ui-tabs__tab-badge')

      expect(shown.classes()).toContain(modifier)
    })

    it('renders no badge without one', async () => {
      const wrapper = await mount({ items: [{ value: 'a', label: 'Inbox' }] })

      expect(wrapper.find('.ui-tabs__tab-badge').exists()).toBe(false)
    })

    it('pins the badge to the icon when there is one', async () => {
      const wrapper = await mount({ items: [{ value: 'a', label: 'Inbox', icon: 'home', badge: 3, badgeLabel: 'New' }] })

      expect(wrapper.find('.ui-tabs__tab-icon .ui-tabs__tab-badge').exists()).toBe(true)
    })

    it.each([[3, false], [true, true]] as const)('marks a badge %s on the icon as a dot: %s', async (badge, dot) => {
      const wrapper = await mount({ items: [{ value: 'a', label: 'Inbox', icon: 'home', badge, badgeLabel: 'New' }] })

      expect(wrapper.find('.ui-tabs__tab-badge').classes().includes('ui-tabs__tab-badge--dot')).toBe(dot)
    })

    it('puts the badge after the label without an icon', async () => {
      const wrapper = await mount({ items: [{ value: 'a', label: 'Inbox', badge: 3, badgeLabel: 'New' }] })
      const parts = Array.from(wrapper.find('.ui-tabs__tab-content').element.children)

      expect(parts.map(part => part.classList.contains('ui-tabs__tab-label'))).toEqual([true, false])
      expect(parts.map(part => part.classList.contains('ui-tabs__tab-badge'))).toEqual([false, true])
    })
  })

  describe('active glyph', () => {
    const iconItems: MTabItem[] = [
      { value: 'inbox', label: 'Inbox', icon: 'outline-inbox' },
      { value: 'star', label: 'Starred', icon: 'mdi:star-outline', activeIcon: 'mdi:star' },
    ]
    const glyphOf = (wrapper: VueWrapper, index: number) => wrapper.findAll('.ui-tabs__tab-icon')[index]!.html()

    it('fills the outline glyph of the selected tab and no other', async () => {
      const wrapper = await mount({ items: iconItems, modelValue: 'inbox' })

      expect(glyphOf(wrapper, 0)).toContain('baseline-inbox')
      expect(glyphOf(wrapper, 1)).toContain('mdi:star-outline')
    })

    it('draws the activeIcon of the selected tab', async () => {
      const wrapper = await mount({ items: iconItems, modelValue: 'star' })

      expect(glyphOf(wrapper, 0)).toContain('outline-inbox')
      expect(glyphOf(wrapper, 1)).toMatch(/mdi:star(?![-\w])/)
    })

    it('draws the filled glyph of the selected tab in the server HTML', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MTabs, { items: iconItems, modelValue: 'inbox', ariaLabel: 'Mail' }) }))

      expect(html).toContain('baseline-inbox')
    })
  })

  describe('tab slot', () => {
    it('draws the content of every item tab and hands it the item and its selection', async () => {
      const wrapper = await mount({ modelValue: 'two' }, {
        tab: ({ item, selected }: { item: MTabItem, selected: boolean }) => h('em', { class: 'custom' }, `${item.label}${selected ? '*' : ''}`),
      })

      expect(wrapper.findAll('.ui-tabs__tab-label .custom').map(custom => custom.text())).toEqual(['One', 'Two*', 'Three'])
    })
  })
})
