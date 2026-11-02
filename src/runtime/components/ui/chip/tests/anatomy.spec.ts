import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { TYPES, mount, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip · variants (M3 anatomy)', () => {
  describe('variant', () => {
    it.each(['outlined', 'elevated'] as const)('maps variant="%s" onto its modifier', async (variant) => {
      const wrapper = await mount({ type: 'assist', variant })

      expect(wrapper.classes()).toContain(`ui-chip--${variant}`)
    })

    it.each(TYPES)('defaults a %s chip to outlined — suggestion included (M3 flat)', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.classes()).toContain('ui-chip--outlined')
      expect(wrapper.classes()).not.toContain('ui-chip--elevated')
    })

    it('keeps an input chip outlined: it has no elevated variant', async () => {
      const wrapper = await mount({ type: 'input', variant: 'elevated' })

      expect(wrapper.classes()).toContain('ui-chip--outlined')
      expect(wrapper.classes()).not.toContain('ui-chip--elevated')
    })
  })

  describe('selected checkmark', () => {
    it('shows a checkmark in place of the leading icon while a filter chip is selected', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: true }, { default: () => 'Unread', icon: () => h('i', { class: 'own-icon' }) })

      expect(wrapper.find('.ui-chip__leading .ui-chip__check').exists()).toBe(true)
      expect(wrapper.find('.own-icon').exists()).toBe(false)
    })

    it('shows the leading icon again once unselected', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: false }, { default: () => 'Unread', icon: () => h('i', { class: 'own-icon' }) })

      expect(wrapper.find('.ui-chip__check').exists()).toBe(false)
      expect(wrapper.find('.ui-chip__icon .own-icon').exists()).toBe(true)
    })

    it('keeps a zero-width leading box on an unselected filter chip, so the check grows into it', async () => {
      const unselected = await mount({ type: 'filter', modelValue: false })
      expect(unselected.find('.ui-chip__leading').exists()).toBe(true)
      expect(unselected.classes()).not.toContain('ui-chip--leading')

      const selected = await mount({ type: 'filter', modelValue: true })
      expect(selected.classes()).toContain('ui-chip--leading')
    })

    it('shows no checkmark with showSelectedIcon off', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: true, showSelectedIcon: false })

      expect(wrapper.find('.ui-chip__check').exists()).toBe(false)
      expect(wrapper.find('.ui-chip__leading').exists()).toBe(false)
    })

    it('lets the selected-icon slot replace the checkmark, with the chip state', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: true }, {
        'default': () => 'Unread',
        'selected-icon': (scope: { selected: boolean, disabled: boolean, blocked: boolean }) => `${scope.selected}:${scope.disabled}:${scope.blocked}`,
      })

      expect(wrapper.find('.ui-chip__check').text()).toBe('true:false:false')
    })

    it.each(['assist', 'input', 'suggestion'] as const)('never draws a checkmark on a %s chip', async (type) => {
      const wrapper = await mount({ type, modelValue: true })

      expect(wrapper.find('.ui-chip__check').exists()).toBe(false)
    })
  })

  describe('avatar', () => {
    it('renders the avatar slot in the leading box and marks the root', async () => {
      const wrapper = await mount({ type: 'input' }, { default: () => 'Ada', avatar: () => h('img', { alt: '' }) })

      expect(wrapper.find('.ui-chip__leading .ui-chip__avatar img').exists()).toBe(true)
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-chip--leading', 'ui-chip--avatar']))
    })
  })

  describe('edges', () => {
    it('marks a trailing edge only when something stands there', async () => {
      const bare = await mount()
      expect(bare.classes()).not.toContain('ui-chip--trailing')

      const withTrailing = await mount({}, { default: () => 'Sort', trailing: () => '▾' })
      expect(withTrailing.classes()).toContain('ui-chip--trailing')
    })

    it('marks a leading edge for an icon', async () => {
      const wrapper = await mount({}, { default: () => 'Call', icon: () => 'I' })

      expect(wrapper.classes()).toContain('ui-chip--leading')
    })
  })

  describe('removal', () => {
    it('stays one button by default', async () => {
      const wrapper = await mount({ type: 'input' })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.find('.ui-chip__remove').exists()).toBe(false)
    })

    it('becomes a wrapper of two buttons with removal="button"', async () => {
      const wrapper = await mount({ type: 'input', removal: 'button', removeLabel: 'Remove Ada', class: 'own', id: 'ada' })

      expect(wrapper.element.tagName).toBe('SPAN')
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-chip', 'ui-chip--multi', 'own', 'ui-chip--trailing']))
      expect(wrapper.find('button.ui-chip__action').attributes('id')).toBe('ada')
      expect(wrapper.find('button.ui-chip__remove').exists()).toBe(true)
    })

    it('stays one button with removal="whole" and shows a close glyph at the end', async () => {
      const wrapper = await mount({ type: 'input', removal: 'whole', removeLabel: 'Remove Ada' })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.find('.ui-chip__trailing').exists()).toBe(true)
      expect(wrapper.classes()).toContain('ui-chip--trailing')
    })

    it('lets the trailing slot replace the close glyph of a whole-chip removal', async () => {
      const wrapper = await mount({ type: 'input', removal: 'whole', removeLabel: 'Remove' }, { default: () => 'Ada', trailing: () => '×' })

      expect(wrapper.find('.ui-chip__trailing').text()).toBe('×')
    })
  })
})
