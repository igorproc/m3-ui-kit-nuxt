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

describe('m-avatar · variants', () => {
  it('defaults to a tonal, default-density, round avatar', async () => {
    const wrapper = await mount({ name: 'Ada' })

    expect(wrapper.classes()).toEqual(['ui-avatar', 'ui-avatar--density-default', 'ui-avatar--tonal', 'ui-avatar--shape-full'])
  })

  describe('axes', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps density %s onto its own modifier', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-avatar--density-${density}`)
    })

    it.each(['tonal', 'filled', 'outlined'] as const)('maps variant %s onto its own modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-avatar--${variant}`)
    })

    it.each(['full', 'large', 'medium', 'small'] as const)('maps shape %s onto its own modifier', async (shape) => {
      const wrapper = await mount({ shape })

      expect(wrapper.classes()).toContain(`ui-avatar--shape-${shape}`)
    })

    it('combines the three axes without interference', async () => {
      const wrapper = await mount({ density: 'comfortable', shape: 'medium', variant: 'outlined' })

      expect(wrapper.classes()).toEqual(['ui-avatar', 'ui-avatar--density-comfortable', 'ui-avatar--outlined', 'ui-avatar--shape-medium'])
    })
  })

  describe('fallback pipeline', () => {
    it('shows the image when a source is given, and nothing else', async () => {
      const wrapper = await mount({ src: '/a.webp', name: 'Ada Lovelace' })

      expect(wrapper.find('.ui-avatar__image').attributes('src')).toBe('/a.webp')
      expect(wrapper.find('.ui-avatar__initials').exists()).toBe(false)
      expect(wrapper.find('.ui-avatar__icon').exists()).toBe(false)
    })

    it('derives initials from the name without a source', async () => {
      const wrapper = await mount({ name: 'Grace Hopper' })

      expect(wrapper.find('.ui-avatar__initials').text()).toBe('GH')
      expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
    })

    it('treats an empty source as no source', async () => {
      const wrapper = await mount({ src: '', name: 'Grace Hopper' })

      expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
      expect(wrapper.find('.ui-avatar__initials').text()).toBe('GH')
    })

    it('falls through a blank name to the explicit icon', async () => {
      const wrapper = await mount({ name: '   ', icon: 'round-groups' })

      expect(wrapper.find('.ui-avatar__initials').exists()).toBe(false)
      expect(wrapper.find('.ui-avatar__icon').exists()).toBe(true)
      expect(wrapper.html()).toContain('round-groups')
    })

    it('ends at the default person icon', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-avatar__icon').exists()).toBe(true)
      expect(wrapper.html()).toContain('outline-person')
    })
  })

  describe('slots', () => {
    it('lets the default slot own the content, with the density and failure state', async () => {
      const wrapper = await mount(
        { src: '/a.webp', name: 'Ada Lovelace', density: 'compact' },
        { default: ({ density, failed }: { density: string, failed: boolean }) => h('span', { class: 'custom' }, `${density} ${failed}`) },
      )

      expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
      expect(wrapper.find('.custom').text()).toBe('compact false')
    })

    it('replaces only the fallback through #fallback, with name, initials and icon', async () => {
      const wrapper = await mount(
        { name: 'PrimeTime', icon: 'round-groups' },
        { fallback: ({ name, initials, icon }: { name: string, initials: string, icon: string }) => h('span', { class: 'mono' }, `${name}|${initials}|${icon}`) },
      )

      expect(wrapper.find('.mono').text()).toBe('PrimeTime|PR|round-groups')
      expect(wrapper.find('.ui-avatar__initials').exists()).toBe(false)
    })

    it('keeps #fallback out while the image shows', async () => {
      const wrapper = await mount({ src: '/a.webp', name: 'Ada' }, { fallback: () => h('span', { class: 'mono' }, 'F') })

      expect(wrapper.find('.mono').exists()).toBe(false)
    })
  })

  describe('state modifiers', () => {
    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ src: '/a.webp', name: 'Ada' })

      expect(Object.keys(wrapper.attributes()).some(name => name.startsWith('data-'))).toBe(false)
    })
  })
})
