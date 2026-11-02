import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import MSplitButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

const menu = () => h(MMenuItem, { label: 'Save as draft' })

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'Save' }) {
  if (current) current.unmount()
  current = await mountSuspended(MSplitButton, { props, slots })

  return current as VueWrapper
}

const action = (wrapper: VueWrapper) => wrapper.find('.ui-split-button__action')
const trailing = (wrapper: VueWrapper) => wrapper.find('.ui-split-button__trailing')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-split · a11y', () => {
  describe('names', () => {
    it('names the action by its label', async () => {
      const wrapper = await mount()

      expect(action(wrapper).text()).toBe('Save')
      expect(action(wrapper).attributes('aria-label')).toBeUndefined()
    })

    it('names the icon-only trailing button by trailingAriaLabel', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More save options' })

      expect(trailing(wrapper).attributes('aria-label')).toBe('More save options')
    })

    it('ships no English default name for the trailing button', async () => {
      const wrapper = await mount()

      expect(trailing(wrapper).attributes('aria-label')).toBeUndefined()
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest resolves to `false`.
  })

  describe('menu', () => {
    it('announces the menu it opens and its state', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More' }, { default: () => 'Save', menu })

      expect(trailing(wrapper).attributes()).toMatchObject({ 'aria-haspopup': 'menu', 'aria-expanded': 'false' })

      await trailing(wrapper).trigger('click')

      expect(trailing(wrapper).attributes('aria-expanded')).toBe('true')
    })

    it('gives every MMenuItem row the menuitem role, and a disabled one aria-disabled', async () => {
      current?.unmount()
      current = await mountSuspended(MSplitButton, {
        props: { trailingAriaLabel: 'More' },
        slots: { default: () => 'Save', menu: () => [h(MMenuItem, { label: 'Save as draft' }), h(MMenuItem, { label: 'Save as template', disabled: true })] },
        attachTo: document.body,
      })
      await trailing(current as VueWrapper).trigger('click')
      await nextTick()
      const rows = Array.from(document.querySelectorAll<HTMLElement>('.ui-menu__surface .ui-menu__item'))

      expect(rows.map(row => row.getAttribute('role'))).toEqual(['menuitem', 'menuitem'])
      expect(rows.map(row => row.getAttribute('aria-disabled'))).toEqual([null, 'true'])
      expect(rows[1]!.hasAttribute('disabled')).toBe(false)
    })

    it('claims no popup without a menu slot', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More' })

      expect(trailing(wrapper).attributes('aria-haspopup')).toBeUndefined()
      expect(trailing(wrapper).attributes('aria-expanded')).toBeUndefined()
    })
  })

  describe('states', () => {
    it('keeps both buttons from submitting a surrounding form', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More' })

      expect(action(wrapper).attributes('type')).toBe('button')
      expect(trailing(wrapper).attributes('type')).toBe('button')
    })

    it('takes both buttons out of the tab order natively while disabled', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More', disabled: true })

      expect(action(wrapper).attributes('disabled')).toBeDefined()
      expect(trailing(wrapper).attributes('disabled')).toBeDefined()
    })

    it('keeps both buttons focusable while the action loads', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More', loading: true }, { default: () => 'Save', menu })

      expect(action(wrapper).attributes()).toMatchObject({ 'aria-busy': 'true', 'aria-disabled': 'true' })
      expect(action(wrapper).attributes('disabled')).toBeUndefined()
      expect(trailing(wrapper).attributes('aria-disabled')).toBe('true')
      expect(trailing(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('has no aria-disabled on the trailing button while idle', async () => {
      const wrapper = await mount({ trailingAriaLabel: 'More' })

      expect(trailing(wrapper).attributes('aria-disabled')).toBeUndefined()
    })
  })
})
