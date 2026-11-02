import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Slots, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MButton, { props, slots, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button · a11y', () => {
  describe('role and name', () => {
    it('relies on the native button role rather than an invented one', async () => {
      const wrapper = await mount({}, { default: () => 'Save' })

      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('never submits a surrounding form unless asked to', async () => {
      const wrapper = await mount({}, { default: () => 'Save' })

      expect(wrapper.attributes('type')).toBe('button')
    })

    it('is named by its label text', async () => {
      const wrapper = await mount({}, { default: () => 'Save' })

      expect(wrapper.text()).toBe('Save')
    })

    it('takes aria-label and aria-labelledby for an icon-only button', async () => {
      const labelled = await mount({}, { prepend: () => 'P' }, { 'aria-label': 'Print' })
      expect(labelled.attributes('aria-label')).toBe('Print')

      const referenced = await mount({}, { prepend: () => 'P' }, { 'aria-labelledby': 'print-label' })
      expect(referenced.attributes('aria-labelledby')).toBe('print-label')
    })

    it('keeps the label in the tree as the name while loading', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Save' })

      expect(wrapper.find('.ui-button__label').text()).toBe('Save')
      expect(wrapper.find('.ui-button__label').attributes('aria-hidden')).toBeUndefined()
    })
  })

  describe('pressed state', () => {
    it('has no aria-pressed on a plain action', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it.each([[true, 'true'], [false, 'false']] as const)('states selected=%s as aria-pressed="%s"', async (selected, pressed) => {
      const wrapper = await mount({ selected })

      expect(wrapper.attributes('aria-pressed')).toBe(pressed)
    })
  })

  describe('disabled and busy', () => {
    it('leaves the tab order with a native disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })

    it.each([
      ['loading', { loading: true }],
      ['soft-disabled', { softDisabled: true }],
    ])('keeps a %s button focusable through aria-disabled', async (_, props) => {
      const wrapper = await mount(props)

      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('states loading as aria-busy and only then', async () => {
      const loading = await mount({ loading: true })
      expect(loading.attributes('aria-busy')).toBe('true')

      const idle = await mount()
      expect(idle.attributes('aria-busy')).toBeUndefined()
    })

    it('hides the spinner from assistive tech', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Save' })

      expect(wrapper.find('.ui-button__spinner').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('link', () => {
    it('is a real link with no pressed state or aria-disabled while enabled', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders' }, { default: () => 'Orders' })
      const link = wrapper.find('a')

      expect(link.attributes('href')).toBe('/orders')
      expect(link.attributes('aria-disabled')).toBeUndefined()
      expect(link.attributes('type')).toBeUndefined()
    })

    it('says what a disabled link is: role link, aria-disabled, out of the tab order', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders', disabled: true }, { default: () => 'Orders' })
      const link = wrapper.find('a')

      expect(link.attributes()).toMatchObject({ 'role': 'link', 'aria-disabled': 'true' })
      expect(link.attributes('tabindex')).toBeUndefined()
      expect(link.classes()).toContain('ui-button--disabled')
    })

    it('keeps a loading link focusable and states it as aria-disabled', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders', loading: true }, { default: () => 'Orders' })

      expect(wrapper.find('a').attributes('aria-disabled')).toBe('true')
      expect(wrapper.find('a').attributes('aria-busy')).toBe('true')
    })
  })
})
