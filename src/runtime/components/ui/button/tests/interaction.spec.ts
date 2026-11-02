import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { ripple } from '#kit/directives/ripple'
import MButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Slots, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MButton, { props, slots, attrs })

  return current as VueWrapper
}

async function serverRender(props: Record<string, unknown>, slots?: Slots) {
  const app = createSSRApp({ render: () => h(MButton, props, slots) })
  app.directive('ripple', ripple)

  return renderToString(app)
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button · interaction', () => {
  describe('activation', () => {
    it('reaches the consumer\'s click handler', async () => {
      const onClick = vi.fn()
      const wrapper = await mount({}, undefined, { onClick })

      await wrapper.trigger('click')

      expect(onClick).toHaveBeenCalledOnce()
    })

    it.each(['button', 'submit', 'reset'] as const)('forwards the native type %s', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.attributes('type')).toBe(type)
    })

    it.each([
      ['loading', { loading: true }],
      ['soft-disabled', { softDisabled: true }],
    ])('swallows the click of a %s button before any handler', async (_, props) => {
      const onClick = vi.fn()
      const wrapper = await mount(props, undefined, { onClick })

      await wrapper.trigger('click')

      expect(onClick).not.toHaveBeenCalled()
    })

    it('lets a real disabled win over softDisabled: the native attribute leaves the tab order', async () => {
      const wrapper = await mount({ disabled: true, softDisabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })
  })

  describe('toggle', () => {
    it.each([false, true])('reports the opposite of selected=%s through v-model:selected', async (selected) => {
      const wrapper = await mount({ selected })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:selected')).toEqual([[!selected]])
    })

    // B8.3b: a link navigates; it has no pressed state, so it must not toggle either.
    it('does not toggle a link, even with selected bound', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders', selected: false }, { default: () => 'Orders' })

      await wrapper.find('a').trigger('click')

      expect(wrapper.emitted('update:selected')).toBeUndefined()
      expect(wrapper.find('a').attributes('aria-pressed')).toBeUndefined()
    })

    it('emits nothing for a plain button', async () => {
      const wrapper = await mount()

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:selected')).toBeUndefined()
    })

    it.each([
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
      ['soft-disabled', { softDisabled: true }],
    ])('does not toggle while %s', async (_, props) => {
      const wrapper = await mount({ selected: false, ...props })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:selected')).toBeUndefined()
    })
  })

  describe('link', () => {
    it('keeps the destination of a loading link and swallows its activation', async () => {
      const onClick = vi.fn()
      const wrapper = await mount({ tag: 'link', to: '/orders', loading: true }, { default: () => 'Orders' }, { onClick })

      expect(wrapper.find('a').attributes('href')).toBe('/orders')
      await wrapper.find('a').trigger('click')
      expect(onClick).not.toHaveBeenCalled()
    })

    it('drops every destination of a disabled link, even an href among the attributes', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders', disabled: true }, { default: () => 'Orders' }, { href: '/elsewhere' })

      expect(wrapper.find('a').attributes('href')).toBeUndefined()
    })

    it('passes the consumer\'s attributes to an enabled link', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders' }, { default: () => 'Orders' }, { 'data-test': 'orders' })

      expect(wrapper.find('a').attributes('data-test')).toBe('orders')
    })
  })

  describe('attributes', () => {
    it('puts the consumer\'s class, style and attributes on the root', async () => {
      const wrapper = await mount({}, undefined, { 'class': 'extra', 'style': 'margin: 1px', 'data-test': 'save', 'aria-describedby': 'hint' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-button', 'extra']))
      expect(wrapper.attributes('style')).toContain('margin')
      expect(wrapper.attributes()).toMatchObject({ 'data-test': 'save', 'aria-describedby': 'hint' })
    })

    it('keeps the spring transition next to a consumer style on a toggle', async () => {
      const wrapper = await mount({ selected: false }, undefined, { style: 'margin: 1px' })
      const style = (wrapper.element as HTMLElement).style

      expect(style.margin).toBe('1px')
      expect(style.transition).toContain('border-radius')
    })
  })

  describe('server render', () => {
    it('states the toggle and its modifier in the first paint', async () => {
      const html = await serverRender({ selected: true }, { default: () => 'Bold' })

      expect(html).toContain('aria-pressed="true"')
      expect(html).toContain('ui-button--selected')
    })

    it('states a loading button as busy, inert and focusable in the first paint', async () => {
      const html = await serverRender({ loading: true }, { default: () => 'Save' })

      expect(html).toContain('aria-busy="true"')
      expect(html).toContain('aria-disabled="true"')
      expect(html).not.toMatch(/\sdisabled[=\s>]/)
    })

    it('renders the icon-only modifier on the server', async () => {
      const html = await serverRender({}, { prepend: () => 'P' })

      expect(html).toContain('ui-button--icon-only')
    })
  })
})
