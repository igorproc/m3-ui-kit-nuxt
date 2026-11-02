import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MIcon from '../index.vue'
import type { MIconName, MIconStyle } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: { name: MIconName, filled?: boolean, label?: string, mirror?: boolean }, attrs: Record<string, string> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MIcon, { props, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const STYLES: MIconStyle[] = ['baseline', 'outline', 'round', 'sharp', 'twotone']

describe('m-icon · variants', () => {
  describe('root', () => {
    it('renders the icon box as a span with its block class', async () => {
      const wrapper = await mount({ name: 'home' })

      expect(wrapper.element.tagName).toBe('SPAN')
      expect(wrapper.classes()).toContain('ui-icon')
    })

    it('draws the glyph inside the box under its own element class', async () => {
      const wrapper = await mount({ name: 'home' })

      expect(wrapper.find('.iconify').classes()).toContain('ui-icon__glyph')
    })
  })

  describe('name', () => {
    it('resolves an ICONS key to the kit glyph', async () => {
      const wrapper = await mount({ name: 'chevronLeft' })

      expect(wrapper.html()).toContain('ic:outline-chevron-left')
    })

    it.each(STYLES)('prefixes a bare %s name with the ic collection', async (style) => {
      const wrapper = await mount({ name: `${style}-close` })

      expect(wrapper.html()).toContain(`ic:${style}-close`)
    })

    it('keeps an explicit collection prefix untouched', async () => {
      const wrapper = await mount({ name: 'mdi:account' })
      const html = wrapper.html()

      expect(html).toContain('mdi:account')
      expect(html).not.toContain('ic:mdi')
    })

    it('keeps the box and renders no glyph when the name is empty', async () => {
      const wrapper = await mount({ name: '' as MIconName })

      expect(wrapper.classes()).toContain('ui-icon')
      expect(wrapper.find('.iconify').exists()).toBe(false)
    })
  })

  describe('filled', () => {
    it('draws the glyph as given by default', async () => {
      const wrapper = await mount({ name: 'home' })

      expect(wrapper.html()).toContain('ic:outline-home')
    })

    it('swaps an outline glyph for its baseline pair', async () => {
      const wrapper = await mount({ name: 'ic:outline-star', filled: true })

      expect(wrapper.html()).toContain('ic:baseline-star')
      expect(wrapper.html()).not.toContain('ic:outline-star')
    })

    it('fills an ICONS key', async () => {
      const wrapper = await mount({ name: 'home', filled: true })

      expect(wrapper.html()).toContain('ic:baseline-home')
    })

    it.each(STYLES.filter(style => style !== 'outline'))('leaves a %s glyph as given: it has no outline pair', async (style) => {
      const wrapper = await mount({ name: `${style}-star`, filled: true })

      expect(wrapper.html()).toContain(`ic:${style}-star`)
    })

    it('leaves a glyph of another collection as given', async () => {
      const wrapper = await mount({ name: 'mdi:star-outline', filled: true })

      expect(wrapper.html()).toContain('mdi:star-outline')
      expect(wrapper.html()).not.toContain('baseline')
    })
  })

  // Q27-А: a glyph that points along the reading direction turns around in RTL.
  describe('mirror', () => {
    it.each([
      [true, true],
      [false, false],
    ])('mirror=%s sets the mirror modifier: %s', async (mirror, modified) => {
      const wrapper = await mount({ name: 'chevronRight', mirror })

      expect(wrapper.classes().includes('ui-icon--mirror')).toBe(modified)
    })

    it('does not mirror by default', async () => {
      const wrapper = await mount({ name: 'chevronRight' })

      expect(wrapper.classes()).not.toContain('ui-icon--mirror')
    })

    it('keeps the glyph and its name when mirrored', async () => {
      const wrapper = await mount({ name: 'chevronRight', mirror: true, label: 'Next' })

      expect(wrapper.html()).toContain('ic:outline-chevron-right')
      expect(wrapper.attributes('aria-label')).toBe('Next')
    })
  })

  describe('fallthrough attributes', () => {
    it('merges a class with the root class and passes data attributes', async () => {
      const wrapper = await mount({ name: 'home' }, { 'class': 'owner__icon', 'data-test': 'glyph' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-icon', 'owner__icon']))
      expect(wrapper.attributes('data-test')).toBe('glyph')
    })
  })
})
