import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MListItem from '../index.vue'
import MList from '../../index.vue'
import MDivider from '../../../divider/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MListItem, { props, slots, attrs })

  return current as VueWrapper
}

async function inList(props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render: () => h(MList, null, { default: () => h(MListItem, props, slots) }) }))

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list-item · a11y', () => {
  describe('role and tab stop', () => {
    it('gives a static row no role and no tab stop', async () => {
      const wrapper = await mount({ headline: 'Static' })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it('emulates a button on a non-button interactive element', async () => {
      const wrapper = await mount({ interactive: true })

      expect(wrapper.attributes('role')).toBe('button')
      expect(wrapper.attributes('tabindex')).toBe('0')
    })

    it('relies on the native button and anchor rather than emulating them', async () => {
      const button = await mount({ tag: 'button' })
      expect(button.attributes('role')).toBeUndefined()
      expect(button.attributes('tabindex')).toBeUndefined()

      const link = await mount({ to: '/inbox' })
      expect(link.attributes('role')).toBeUndefined()
      expect(link.attributes('tabindex')).toBeUndefined()
    })

    it('leaves the role to a consumer who set one', async () => {
      const wrapper = await mount({ interactive: true }, undefined, { role: 'option' })

      expect(wrapper.attributes('role')).toBe('option')
    })
  })

  describe('inside a list', () => {
    it('is the li itself when static', async () => {
      const wrapper = await inList({ headline: 'Static' })
      const row = wrapper.find('.ui-list-item')

      expect(row.element.tagName).toBe('LI')
      expect(row.element.parentElement!.tagName).toBe('UL')
    })

    it('sits inside a bare li when interactive, with every consumer attribute on the row', async () => {
      const wrapper = await inList({ 'headline': 'Action', 'tag': 'button', 'selected': true, 'data-test': 'row' })
      const item = wrapper.find('.ui-list__row')
      const row = wrapper.find('.ui-list-item')

      expect(item.attributes()).toEqual({ class: 'ui-list__row' })
      expect(row.element.parentElement).toBe(item.element)
      expect(row.attributes('aria-pressed')).toBe('true')
      expect(row.attributes('data-test')).toBe('row')
    })

    it('keeps its own content out of the list structure', async () => {
      const wrapper = await inList({ headline: 'Row' }, { default: () => h(MDivider) })
      const divider = wrapper.find('.ui-divider')

      expect(divider.element.tagName).toBe('DIV')
      expect(divider.attributes('role')).toBe('separator')
    })
  })

  describe('disabled', () => {
    it('says it on an emulated button and leaves the tab order', async () => {
      const wrapper = await mount({ interactive: true, disabled: true })

      expect(wrapper.attributes('role')).toBe('button')
      expect(wrapper.attributes('tabindex')).toBe('-1')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('says it on a static row, so dimmed text is not the only sign', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('leaves a native button to its own attribute', async () => {
      const wrapper = await mount({ tag: 'button', disabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })

    it('drops the href of a link, stays announced as an unavailable link and leaves the tab order', async () => {
      const wrapper = await mount({ tag: 'a', disabled: true, headline: 'Archive' }, undefined, { href: '/archive' })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBeUndefined()
      expect(wrapper.attributes('role')).toBe('link')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it('renders a disabled route link as a plain anchor without href', async () => {
      const wrapper = await mount({ to: '/archive', disabled: true })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBeUndefined()
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('reports nothing on an enabled link', async () => {
      const wrapper = await mount({ to: '/archive' })

      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })
  })

  describe('selected', () => {
    it('is aria-pressed on a button, true or false once the row is part of a selection', async () => {
      const on = await mount({ tag: 'button', selected: true })
      expect(on.attributes('aria-pressed')).toBe('true')

      const off = await mount({ tag: 'button', selected: false })
      expect(off.attributes('aria-pressed')).toBe('false')
    })

    it('is aria-pressed on an emulated button', async () => {
      const wrapper = await mount({ interactive: true, selected: true })

      expect(wrapper.attributes('aria-pressed')).toBe('true')
    })

    it('leaves a plain action row a plain button', async () => {
      const wrapper = await mount({ tag: 'button' })

      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('is aria-current="page" on a link, and absent while not selected', async () => {
      const on = await mount({ tag: 'a', selected: true }, undefined, { href: '/inbox' })
      expect(on.attributes('aria-current')).toBe('page')
      expect(on.attributes('aria-pressed')).toBeUndefined()

      const off = await mount({ tag: 'a', selected: false }, undefined, { href: '/inbox' })
      expect(off.attributes('aria-current')).toBeUndefined()
    })

    it('adds nothing when the consumer set a role', async () => {
      const wrapper = await mount({ interactive: true, selected: true }, undefined, { 'role': 'option', 'aria-selected': 'true' })

      expect(wrapper.attributes('aria-selected')).toBe('true')
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
      expect(wrapper.attributes('aria-current')).toBeUndefined()
    })

    // B9.1 (Q46-А): `aria-selected` is invalid on a list item; a static selected
    // row is the current one of its list, so the state is not colour alone.
    it('is aria-current on a static row, the li itself inside a list', async () => {
      const wrapper = await inList({ headline: 'Inbox', selected: true })
      const row = wrapper.find('.ui-list-item')

      expect(row.element.tagName).toBe('LI')
      expect(row.attributes('aria-current')).toBe('true')
      expect(row.attributes('aria-pressed')).toBeUndefined()
    })

    it('is aria-current on a static row outside a list too', async () => {
      const wrapper = await mount({ selected: true })

      expect(wrapper.attributes('aria-current')).toBe('true')
    })

    it('drops aria-current from a static row that is not selected', async () => {
      const off = await mount({ selected: false })
      expect(off.attributes('aria-current')).toBeUndefined()

      const plain = await mount()
      expect(plain.attributes('aria-current')).toBeUndefined()
    })

    it('leaves a static row with a consumer role to its owner', async () => {
      const wrapper = await mount({ selected: true }, undefined, { role: 'option' })

      expect(wrapper.attributes('aria-current')).toBeUndefined()
    })
  })
})
