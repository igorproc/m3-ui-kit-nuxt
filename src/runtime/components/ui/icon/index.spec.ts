import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MIcon from './index.vue'
import type { MIconName } from './props'

const mount = (props: { name: MIconName, filled?: boolean, label?: string }, attrs: Record<string, string> = {}) =>
  mountSuspended(MIcon, { props, attrs })

describe('m-icon', () => {
  it('renders the icon wrapper span as the root', async () => {
    const wrapper = await mount({ name: 'home' })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ui-icon')
  })

  it('resolves an ICONS key to the kit glyph', async () => {
    const wrapper = await mount({ name: 'chevronLeft' })

    expect(wrapper.html()).toContain('ic:outline-chevron-left')
  })

  it('prefixes a bare name with the ic collection', async () => {
    const wrapper = await mount({ name: 'round-close' })

    expect(wrapper.html()).toContain('ic:round-close')
  })

  it('keeps an explicit collection prefix untouched', async () => {
    const wrapper = await mount({ name: 'mdi:account' })

    const html = wrapper.html()
    expect(html).toContain('mdi:account')
    expect(html).not.toContain('ic:mdi')
  })

  describe('filled', () => {
    it('swaps an outline glyph for its baseline pair', async () => {
      const wrapper = await mount({ name: 'ic:outline-star', filled: true })

      expect(wrapper.html()).toContain('ic:baseline-star')
      expect(wrapper.html()).not.toContain('ic:outline-star')
    })

    it('fills an ICONS key', async () => {
      const wrapper = await mount({ name: 'home', filled: true })

      expect(wrapper.html()).toContain('ic:baseline-home')
    })

    it('leaves a glyph without an outline pair as given', async () => {
      const wrapper = await mount({ name: 'round-star', filled: true })

      expect(wrapper.html()).toContain('ic:round-star')
      expect(wrapper.html()).not.toContain('baseline')
    })
  })

  describe('accessibility', () => {
    it('is decorative without a label: hidden from assistive tech, no role, no name', async () => {
      const wrapper = await mount({ name: 'home' })

      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('is a named image with a label and is not hidden', async () => {
      const wrapper = await mount({ name: 'error', label: 'Error' })

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Error')
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    })

    it('treats an empty label as no label', async () => {
      const wrapper = await mount({ name: 'home', label: '' })

      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('keeps the glyph itself out of the accessibility tree with and without a label', async () => {
      for (const label of [undefined, 'Home']) {
        const wrapper = await mount({ name: 'home', label })
        const glyph = wrapper.find('.iconify')

        expect(glyph.exists()).toBe(true)
        expect(glyph.attributes('aria-hidden')).toBe('true')
        expect(glyph.attributes('focusable')).toBe('false')
      }
    })
  })

  describe('empty name', () => {
    it('keeps the wrapper and renders no glyph', async () => {
      const wrapper = await mount({ name: '' as MIconName })

      expect(wrapper.classes()).toContain('ui-icon')
      expect(wrapper.find('.iconify').exists()).toBe(false)
    })
  })

  describe('fallthrough attributes', () => {
    it('merges a class with the root class and passes data attributes', async () => {
      const wrapper = await mount({ name: 'home' }, { 'class': 'owner__icon', 'data-test': 'glyph' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-icon', 'owner__icon']))
      expect(wrapper.attributes('data-test')).toBe('glyph')
    })

    it('accepts an explicit aria-hidden from the owner', async () => {
      const wrapper = await mount({ name: 'home' }, { 'aria-hidden': 'true' })

      expect(wrapper.attributes('aria-hidden')).toBe('true')
    })
  })
})
