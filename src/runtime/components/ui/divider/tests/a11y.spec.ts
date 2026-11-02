import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MDivider from '../index.vue'
import MList from '../../list/index.vue'
import MListItem from '../../list/item/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MDivider, { props })

  return current as VueWrapper
}

async function inside(listProps: Record<string, unknown> | null, render: () => unknown) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render: () => h(MList, listProps, { default: render }) }))

  return (current as VueWrapper).find('.ui-divider')
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-divider · a11y', () => {
  describe('standalone', () => {
    it('is a separator a screen reader announces', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('role')).toBe('separator')
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    })

    it.each(['horizontal', 'vertical'] as const)('states its %s orientation', async (orientation) => {
      const wrapper = await mount({ orientation })

      expect(wrapper.attributes('aria-orientation')).toBe(orientation)
    })
  })

  describe('inside a list', () => {
    it('is decoration among list items: hidden, without a separator role', async () => {
      const divider = await inside(null, () => h(MDivider))

      expect(divider.attributes('aria-hidden')).toBe('true')
      expect(divider.attributes('role')).toBeUndefined()
      expect(divider.attributes('aria-orientation')).toBeUndefined()
    })

    it('is decoration in a role-bearing list as well', async () => {
      const divider = await inside({ role: 'listbox' }, () => h(MDivider))

      expect(divider.attributes('aria-hidden')).toBe('true')
      expect(divider.attributes('role')).toBeUndefined()
    })

    it('is a real separator again inside a row’s own content', async () => {
      const divider = await inside(null, () => h(MListItem, { headline: 'Row' }, { default: () => h(MDivider) }))

      expect(divider.element.tagName).toBe('DIV')
      expect(divider.attributes('role')).toBe('separator')
      expect(divider.attributes('aria-hidden')).toBeUndefined()
    })
  })
})
