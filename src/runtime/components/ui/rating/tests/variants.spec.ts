import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { fills, mount, unmountCurrent, slider } from './helpers'

afterEach(unmountCurrent)

describe('m-rating · variants', () => {
  describe('length', () => {
    it.each([3, 5, 10])('draws %s items', async (length) => {
      const wrapper = await mount({ length })

      expect(wrapper.findAll('.ui-rating__item')).toHaveLength(length)
    })

    it('defaults to five items', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-rating__item')).toHaveLength(5)
    })

    it('never draws fewer than one item', async () => {
      const wrapper = await mount({ length: 0 })

      expect(wrapper.findAll('.ui-rating__item')).toHaveLength(1)
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps color="%s" onto its modifier', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-rating--${color}`)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-rating--primary')
    })
  })

  describe('fill', () => {
    it('fills whole items up to the value and leaves the rest empty', async () => {
      const wrapper = await mount({ modelValue: 3 })

      expect(fills(wrapper).map(style => style.match(/width: (\d+)%/)?.[1])).toEqual(['100', '100', '100', '0', '0'])
    })

    it('fills a fraction of the item a half value lands in', async () => {
      const wrapper = await mount({ modelValue: 2.5, step: 0.5 })

      expect(fills(wrapper)[2]).toContain('width: 50%')
      expect(fills(wrapper)[3]).toContain('width: 0%')
    })

    it('draws an empty and a full glyph in every item', async () => {
      const wrapper = await mount({ length: 2 })
      const item = wrapper.find('.ui-rating__item')

      expect(item.find('.ui-rating__icon--empty').exists()).toBe(true)
      expect(item.find('.ui-rating__fill .ui-rating__icon--full').exists()).toBe(true)
    })

    it('stacks both glyphs in one glyph-sized box, so the fill clips the glyph it covers', async () => {
      const wrapper = await mount({ length: 1, modelValue: 0.5, step: 0.5 })
      const glyph = wrapper.find('.ui-rating__item .ui-rating__glyph')

      expect(glyph.find('.ui-rating__icon--empty').exists()).toBe(true)
      expect(glyph.find('.ui-rating__fill').exists()).toBe(true)
      expect(glyph.find('.ui-rating__fill').attributes('style')).toContain('width: 50%')
    })

    it('takes its glyphs from icon and emptyIcon', async () => {
      const wrapper = await mount({ length: 1, icon: 'ic:outline-favorite', emptyIcon: 'ic:outline-favorite-border' })

      expect(wrapper.find('.ui-rating__icon--full').html()).toContain('ic:outline-favorite')
      expect(wrapper.find('.ui-rating__icon--empty').html()).toContain('ic:outline-favorite-border')
    })
  })

  describe('item slot', () => {
    it('replaces each item and receives its state', async () => {
      const wrapper = await mount({ modelValue: 1.5, step: 0.5, length: 3 }, {
        item: (scope: { index: number, value: number, fill: number, active: boolean }) =>
          h('i', { class: 'custom' }, `${scope.index}:${scope.value}:${scope.fill}:${scope.active}`),
      })

      expect(wrapper.findAll('.custom').map(item => item.text())).toEqual(['0:1:1:true', '1:2:0.5:true', '2:3:0:false'])
      expect(wrapper.find('.ui-rating__fill').exists()).toBe(false)
    })
  })

  describe('state modifiers', () => {
    it.each(['disabled', 'readonly'] as const)('marks %s on the root', async (state) => {
      const wrapper = await mount({ [state]: true })

      expect(wrapper.classes()).toContain(`ui-rating--${state}`)
    })

    it('carries neither modifier by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-rating--disabled')
      expect(wrapper.classes()).not.toContain('ui-rating--readonly')
    })
  })

  describe('form', () => {
    it('posts the value through a hidden input under the name', async () => {
      const wrapper = await mount({ modelValue: 4, name: 'score' })
      const input = wrapper.find('input[type="hidden"]')

      expect(input.attributes('name')).toBe('score')
      expect((input.element as HTMLInputElement).value).toBe('4')
    })

    it('posts nothing without a name', async () => {
      const wrapper = await mount({ modelValue: 4 })

      expect(wrapper.find('input').exists()).toBe(false)
    })
  })
})
