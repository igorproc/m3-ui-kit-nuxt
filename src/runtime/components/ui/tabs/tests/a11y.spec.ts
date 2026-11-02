import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MTabs from '../index.vue'
import MTabPanel from '../panel/index.vue'
import type { MTabItem } from '../props'

const items: MTabItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two', icon: 'home' },
  { value: 'three', label: 'Three', disabled: true },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTabs, { props: { items, ...props }, slots })

  return current as VueWrapper
}

async function mountHost(component: Component, options: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(component, options)

  return current as VueWrapper
}

const panelsSlot = () => [
  h(MTabPanel, { value: 'one' }, () => 'Panel one'),
  h(MTabPanel, { value: 'two' }, () => 'Panel two'),
]

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-tabs · a11y', () => {
  describe('roles', () => {
    it('renders a tablist with one tab per item', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('[role="tablist"]')).toHaveLength(1)
      expect(wrapper.find('[role="tablist"]').findAll('[role="tab"]')).toHaveLength(3)
    })

    it('leaves the wrapper around the tablist without a role', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('gives each rendered panel the tabpanel role', async () => {
      const wrapper = await mount({}, { default: () => 'Body' })

      expect(wrapper.find('.ui-tabs__content').attributes('role')).toBe('tabpanel')
    })
  })

  // B5.5a: the name goes on the tablist, not on the wrapper around it.
  describe('naming', () => {
    it('names the tablist through ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })

      expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('Sections')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('names the tablist through a visible heading', async () => {
      const wrapper = await mount({ ariaLabelledby: 'heading' })

      expect(wrapper.find('[role="tablist"]').attributes('aria-labelledby')).toBe('heading')
    })

    it('ships no name of its own', async () => {
      const wrapper = await mount()
      const list = wrapper.find('[role="tablist"]')

      expect(list.attributes('aria-label')).toBeUndefined()
      expect(list.attributes('aria-labelledby')).toBeUndefined()
    })

    it('names every tab by its label', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })

      expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['One', 'Two', 'Three'])
    })

    it('hides the tab icon from assistive tech', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })
      const icon = wrapper.findAll('[role="tab"]')[1]!.find('.ui-tabs__tab-icon .ui-icon')

      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('states', () => {
    it('reports the selection through aria-selected on every tab', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections', modelValue: 'two' })

      expect(wrapper.findAll('[role="tab"]').map(tab => tab.attributes('aria-selected'))).toEqual(['false', 'true', 'false'])
    })

    it('keeps only the selected tab in the Tab order', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections', modelValue: 'two' })

      expect(wrapper.findAll('[role="tab"]').map(tab => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    })

    // IN-08: like a link tab, a disabled button keeps its place for assistive tech.
    it('marks a disabled button tab with aria-disabled, not the native attribute', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })
      const tab = wrapper.findAll('[role="tab"]')[2]!

      expect(tab.attributes('aria-disabled')).toBe('true')
      expect(tab.attributes('disabled')).toBeUndefined()
    })

    it.each(['primary', 'secondary'] as const)('keeps the tab roles in the %s hierarchy', async (hierarchy) => {
      const wrapper = await mount({ ariaLabel: 'Sections', hierarchy })

      expect(wrapper.find('[role="tablist"]').findAll('[role="tab"]')).toHaveLength(3)
    })
  })

  // A11-04: the count is drawn, its meaning is described, never read as part of the name.
  describe('badge', () => {
    const badged = [{ value: 'a', label: 'Inbox', icon: 'home', badge: 3, badgeLabel: '3 unread' }]

    it('hides the drawn badge from assistive tech', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections', items: badged })

      expect(wrapper.find('.ui-tabs__tab-badge').attributes('aria-hidden')).toBe('true')
    })

    it('describes the tab with badgeLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections', items: badged })
      const tab = wrapper.find('[role="tab"]')
      const description = wrapper.find(`[id="${tab.attributes('aria-describedby')}"]`)

      expect(description.text()).toBe('3 unread')
    })

    it('keeps the description out of the tab name', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections', items: badged })
      const description = wrapper.find(`[id="${wrapper.find('[role="tab"]').attributes('aria-describedby')}"]`)

      expect(description.attributes('aria-hidden')).toBe('true')
    })

    it('describes nothing without a badge', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })

      expect(wrapper.find('[role="tab"]').attributes('aria-describedby')).toBeUndefined()
    })
  })

  // B5.5b: a tab points only at a panel that is rendered.
  describe('relations', () => {
    it('ties the tab and the default panel together both ways', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' }, { default: () => 'Content' })
      const tab = wrapper.findAll('[role="tab"]')[0]!
      const panel = wrapper.find('[role="tabpanel"]')

      expect(tab.attributes('aria-controls')).toBe(panel.attributes('id'))
      expect(panel.attributes('aria-labelledby')).toBe(tab.attributes('id'))
    })

    it('points every tab at its own panel id when panels are rendered', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' }, { default: () => 'Content' })
      const controls = wrapper.findAll('[role="tab"]').map(tab => tab.attributes('aria-controls'))

      expect(new Set(controls).size).toBe(3)
    })

    it('sets no aria-controls when the tabs render no panel', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })

      for (const tab of wrapper.findAll('[role="tab"]')) {
        expect(tab.attributes('aria-controls')).toBeUndefined()
      }
    })

    it('ties a panel from the panels slot to its tab', async () => {
      const wrapper = await mountHost(defineComponent({
        render: () => h(MTabs, { items, modelValue: 'one', ariaLabel: 'Sections' }, { panels: panelsSlot }),
      }))
      const panel = wrapper.find('[role="tabpanel"]')
      const tab = wrapper.findAll('[role="tab"]')[0]!

      expect(tab.attributes('aria-controls')).toBe(panel.attributes('id'))
      expect(panel.attributes('aria-labelledby')).toBe(tab.attributes('id'))
    })

    it('renames the default panel after the newly selected tab', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections', modelValue: 'one' }, { default: () => 'Content' })

      await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

      expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe(wrapper.findAll('[role="tab"]')[1]!.attributes('id'))
    })

    it('ties the preset tab to the default panel in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MTabs, { items, modelValue: 'two', ariaLabel: 'Sections' }, { default: () => 'Body' }),
      })))
      const tabId = html.match(/id="([^"]+)"[^>]*aria-selected="true"/)?.[1]
      const panel = html.match(/<div[^>]*role="tabpanel"[^>]*>/)?.[0] ?? ''

      expect(tabId).toBeTruthy()
      expect(panel).toContain(`aria-labelledby="${tabId}"`)
    })
  })

  describe('focus order', () => {
    it('makes the panel itself a Tab stop after the tablist', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' }, { default: () => 'Plain text' })

      expect(wrapper.find('[role="tabpanel"]').attributes('tabindex')).toBe('0')
    })

    it('makes a slotted panel a Tab stop too', async () => {
      const wrapper = await mountHost(defineComponent({
        render: () => h(MTabs, { items, ariaLabel: 'Sections' }, { panels: panelsSlot }),
      }))

      expect(wrapper.find('[role="tabpanel"]').attributes('tabindex')).toBe('0')
    })
  })
})
