import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MFabMenu from '../index.vue'
import type { MFabMenuItem } from '../props'

const items: MFabMenuItem[] = [
  { label: 'Share', icon: 'ic:baseline-share', value: 'share' },
  { label: 'Edit', icon: 'ic:baseline-edit', value: 'edit' },
  { label: 'Delete', value: 'delete', disabled: true },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MFabMenu, { props: { items, ...props } })

  return current as VueWrapper
}

const activator = (wrapper: VueWrapper) => wrapper.find('.ui-fab-menu__activator')

async function open(wrapper: VueWrapper) {
  await activator(wrapper).trigger('click')
  await nextTick()
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-fab-menu · a11y', () => {
  describe('activator', () => {
    it('is named by ariaLabel and ships no English default', async () => {
      const named = await mount({ ariaLabel: 'Create' })
      expect(activator(named).attributes('aria-label')).toBe('Create')

      const unnamed = await mount()
      expect(activator(unnamed).attributes('aria-label')).toBeUndefined()
    })

    it('is a disclosure: aria-expanded follows the menu, aria-controls names the actions only while open', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      expect(activator(wrapper).attributes('aria-expanded')).toBe('false')
      expect(activator(wrapper).attributes('aria-controls')).toBeUndefined()

      await open(wrapper)

      expect(activator(wrapper).attributes('aria-expanded')).toBe('true')
      expect(activator(wrapper).attributes('aria-controls')).toBe(wrapper.find('.ui-fab-menu__drawer').attributes('id'))
    })

    it('claims no popup role: the actions are buttons, not a menu', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      expect(activator(wrapper).attributes('aria-haspopup')).toBeUndefined()
    })

    it('hides both glyphs from assistive tech', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      for (const glyph of wrapper.findAll('.ui-fab-menu__icon')) {
        expect(glyph.attributes('aria-hidden')).toBe('true')
      }
    })
  })

  describe('actions', () => {
    it('lists the actions as list items', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      await open(wrapper)

      expect(wrapper.find('.ui-fab-menu__list').attributes('role')).toBe('list')
      expect(wrapper.findAll('li.ui-fab-menu__entry')).toHaveLength(3)
    })

    it('makes every action a plain button named by its label', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      await open(wrapper)
      const actions = wrapper.findAll('.ui-fab-menu__item')

      expect(actions.every(action => action.element.tagName === 'BUTTON' && action.attributes('type') === 'button')).toBe(true)
      expect(actions.every(action => action.attributes('role') === undefined)).toBe(true)
      expect(actions.map(action => action.text())).toEqual(['Share', 'Edit', 'Delete'])
    })

    it('hides the action icons from assistive tech', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      await open(wrapper)

      for (const icon of wrapper.findAll('.ui-fab-menu__item-icon')) {
        expect(icon.attributes('aria-hidden')).toBe('true')
      }
    })

    it('takes a disabled action out of the tab order natively', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      await open(wrapper)

      expect(wrapper.findAll('.ui-fab-menu__item').map(action => action.attributes('disabled') !== undefined)).toEqual([false, false, true])
    })

    it('makes the leaving actions inert, so focus cannot land on them', async () => {
      const wrapper = await mount({ ariaLabel: 'Create' })

      await open(wrapper)
      expect(wrapper.find('.ui-fab-menu__drawer').attributes('inert')).toBeUndefined()

      await activator(wrapper).trigger('click')
      const drawer = wrapper.find('.ui-fab-menu__drawer')
      if (drawer.exists()) expect(drawer.attributes('inert')).toBeDefined()
    })
  })
})
