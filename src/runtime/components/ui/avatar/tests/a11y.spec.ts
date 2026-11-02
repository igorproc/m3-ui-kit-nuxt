import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MAvatar from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAvatar, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-avatar · a11y', () => {
  describe('naming', () => {
    it('labels the root with the name and keeps the image decorative', async () => {
      const wrapper = await mount({ src: '/a.webp', name: 'Ada Lovelace' })

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Ada Lovelace')
      expect(wrapper.find('.ui-avatar__image').attributes('alt')).toBe('')
    })

    it('lets an explicit alt name the image itself, with no second name on the root', async () => {
      const wrapper = await mount({ src: '/a.webp', name: 'Ada', alt: 'Portrait of Ada' })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
      expect(wrapper.find('.ui-avatar__image').attributes('alt')).toBe('Portrait of Ada')
    })

    it('keeps an avatar with an empty alt decorative, image or not', async () => {
      const image = await mount({ src: '/a.webp', name: 'Ada', alt: '' })
      expect(image.find('.ui-avatar__image').attributes('alt')).toBe('')
      expect(image.attributes('aria-label')).toBeUndefined()

      const initials = await mount({ name: 'Ada Lovelace', alt: '' })
      expect(initials.attributes('role')).toBeUndefined()
      expect(initials.attributes('aria-label')).toBeUndefined()
    })

    it('moves the alt onto the avatar once the image has failed', async () => {
      const wrapper = await mount({ src: '/broken.webp', name: 'Ada', alt: 'Portrait of Ada' })
      expect(wrapper.attributes('role')).toBeUndefined()

      await wrapper.find('.ui-avatar__image').trigger('error')

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Portrait of Ada')
    })

    it('names an image-less avatar with alt before name', async () => {
      const wrapper = await mount({ name: 'Ada Lovelace', alt: 'Team lead' })

      expect(wrapper.attributes('aria-label')).toBe('Team lead')
    })

    it('names an image-less avatar by its trimmed name', async () => {
      const wrapper = await mount({ name: '  Ada Lovelace ' })

      expect(wrapper.attributes('aria-label')).toBe('Ada Lovelace')
    })

    it('stays unlabeled without alt and name', async () => {
      const wrapper = await mount({ src: '/a.webp' })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })
  })

  describe('decoration', () => {
    it('hides the initials — the name on the root already says them', async () => {
      const wrapper = await mount({ name: 'Grace Hopper' })

      expect(wrapper.find('.ui-avatar__initials').attributes('aria-hidden')).toBe('true')
    })

    it('hides the fallback icon', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-avatar__icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('custom content', () => {
    it('lets the default slot own the semantics — the root adds no role or name', async () => {
      const wrapper = await mount({ src: '/a.webp', name: 'Ada Lovelace' }, { default: () => h('span', 'AL') })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('keeps the root name around a custom fallback', async () => {
      const wrapper = await mount({ name: 'PrimeTime' }, { fallback: () => h('span', 'PT') })

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('PrimeTime')
    })
  })

  describe('passive surface', () => {
    it('is never a tab stop', async () => {
      const wrapper = await mount({ name: 'Ada' })

      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })
  })
})
