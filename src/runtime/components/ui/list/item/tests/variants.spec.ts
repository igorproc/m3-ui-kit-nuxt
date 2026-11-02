import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MListItem from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MListItem, { props, slots, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list-item · variants', () => {
  describe('defaults', () => {
    it('renders a static div at the default density and one line', async () => {
      const wrapper = await mount({ headline: 'One line' })

      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.classes()).toEqual(['ui-list-item', 'ui-list-item--lines-1', 'ui-list-item--density-default'])
    })
  })

  describe('tag', () => {
    it.each([
      ['div', 'DIV'],
      ['li', 'LI'],
      ['button', 'BUTTON'],
      ['label', 'LABEL'],
    ] as const)('draws the row with a %s', async (tag, tagName) => {
      const wrapper = await mount({ tag, headline: 'Row' })

      expect(wrapper.element.tagName).toBe(tagName)
    })

    it('draws an anchor for tag="a" and for a route', async () => {
      const anchor = await mount({ tag: 'a', headline: 'Row' }, undefined, { href: '/inbox' })
      expect(anchor.element.tagName).toBe('A')

      const route = await mount({ to: '/inbox', headline: 'Row' })
      expect(route.element.tagName).toBe('A')
      expect(route.attributes('href')).toBe('/inbox')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps %s onto its own modifier', async (density) => {
      const wrapper = await mount({ density, headline: 'Row' })

      expect(wrapper.classes()).toContain(`ui-list-item--density-${density}`)
    })

    it('keeps the line count independent of the density', async () => {
      const wrapper = await mount({ headline: 'Title', supportingText: 'Subtitle', density: 'compact' })

      expect(wrapper.classes()).toContain('ui-list-item--density-compact')
      expect(wrapper.classes()).toContain('ui-list-item--lines-2')
    })
  })

  describe('lines', () => {
    it.each([
      ['a headline alone', { headline: 'Title' }, {}, 1],
      ['supporting text', { headline: 'Title', supportingText: 'Text' }, {}, 2],
      ['a default slot', { headline: 'Title' }, { default: () => 'Body' }, 2],
      ['an overline over supporting text', { overline: 'Over', headline: 'Title', supportingText: 'Text' }, {}, 3],
      ['an overline alone', { overline: 'Over', headline: 'Title' }, {}, 1],
    ] as const)('counts %s as %i line(s) under auto', async (_, props, slots, lines) => {
      const wrapper = await mount({ ...props }, slots as Record<string, () => string>)

      expect(wrapper.classes()).toContain(`ui-list-item--lines-${lines}`)
      expect(wrapper.classes()).not.toContain('ui-list-item--clamped')
    })

    it.each([1, 2, 3] as const)('holds the row at an explicit %i line(s) and clamps it', async (lines) => {
      const wrapper = await mount({ lines, headline: 'Title' })

      expect(wrapper.classes()).toContain(`ui-list-item--lines-${lines}`)
      expect(wrapper.classes()).toContain('ui-list-item--clamped')
    })

    it('keeps the full text of a clamped line as a tooltip', async () => {
      const wrapper = await mount({ lines: 3, overline: 'Over', headline: 'Title', supportingText: 'A long supporting text' })

      expect(wrapper.find('.ui-list-item__overline').attributes('title')).toBe('Over')
      expect(wrapper.find('.ui-list-item__headline').attributes('title')).toBe('Title')
      expect(wrapper.find('.ui-list-item__supporting').attributes('title')).toBe('A long supporting text')
    })

    it('adds no tooltip while the text wraps', async () => {
      const wrapper = await mount({ headline: 'Title', supportingText: 'Text' })

      expect(wrapper.find('.ui-list-item__headline').attributes('title')).toBeUndefined()
      expect(wrapper.find('.ui-list-item__supporting').attributes('title')).toBeUndefined()
    })

    it('leaves slotted text to the consumer to label', async () => {
      const wrapper = await mount({ lines: 1, headline: 'Prop' }, { headline: () => 'Slotted' })

      expect(wrapper.find('.ui-list-item__headline').attributes('title')).toBeUndefined()
    })
  })

  describe('content', () => {
    it('renders headline, supporting and overline props', async () => {
      const wrapper = await mount({ headline: 'Title', supportingText: 'Subtitle', overline: 'Over' })

      expect(wrapper.find('.ui-list-item__headline').text()).toBe('Title')
      expect(wrapper.find('.ui-list-item__supporting').text()).toBe('Subtitle')
      expect(wrapper.find('.ui-list-item__overline').text()).toBe('Over')
    })

    it('reads the body top-down: overline, headline, default slot, supporting', async () => {
      const wrapper = await mount(
        { overline: 'Over', headline: 'Title', supportingText: 'Text' },
        { default: () => 'Body' },
      )

      expect(wrapper.find('.ui-list-item__body').text()).toBe('OverTitleBodyText')
    })

    it.each([
      ['overline', 'overline', '.ui-list-item__overline'],
      ['headline', 'headline', '.ui-list-item__headline'],
      ['supporting', 'supportingText', '.ui-list-item__supporting'],
      ['trailing-supporting', 'trailingSupportingText', '.ui-list-item__trailing-supporting'],
    ] as const)('lets #%s replace its prop', async (slot, prop, selector) => {
      const wrapper = await mount({ [prop]: 'Prop' }, { [slot]: () => 'Slotted' })

      expect(wrapper.find(selector).text()).toBe('Slotted')
    })

    // Q-1 (M3-polish): Vue does not normalise slot names, so a camelCase slot rendered nothing.
    it('fills the trailing supporting text through the kebab-case slot alone', async () => {
      const wrapper = await mount({ headline: 'Inbox' }, { 'trailing-supporting': () => '12' })

      expect(wrapper.find('.ui-list-item__trailing-supporting').text()).toBe('12')
    })

    it('renders no wrapper for a part that has no content', async () => {
      const wrapper = await mount({ headline: 'Title' })

      expect(wrapper.find('.ui-list-item__overline').exists()).toBe(false)
      expect(wrapper.find('.ui-list-item__supporting').exists()).toBe(false)
      expect(wrapper.find('.ui-list-item__leading').exists()).toBe(false)
      expect(wrapper.find('.ui-list-item__trailing').exists()).toBe(false)
    })

    it('always renders the body, even empty', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-list-item__body').exists()).toBe(true)
    })
  })

  describe('leading and trailing', () => {
    it('renders the leading and trailing slots', async () => {
      const wrapper = await mount({}, { leading: () => 'L', trailing: () => 'T' })

      expect(wrapper.find('.ui-list-item__leading').text()).toBe('L')
      expect(wrapper.find('.ui-list-item__trailing').text()).toBe('T')
    })

    it('draws the icon props as kit icons', async () => {
      const wrapper = await mount({ leadingIcon: 'inbox', trailingIcon: 'chevron_right' })

      expect(wrapper.find('.ui-list-item__leading .ui-icon').exists()).toBe(true)
      expect(wrapper.find('.ui-list-item__trailing .ui-icon').exists()).toBe(true)
    })

    it('lets a slot replace the icon prop', async () => {
      const wrapper = await mount({ leadingIcon: 'inbox' }, { leading: () => 'Avatar' })

      expect(wrapper.find('.ui-list-item__leading .ui-icon').exists()).toBe(false)
      expect(wrapper.find('.ui-list-item__leading').text()).toBe('Avatar')
    })

    it('puts trailing supporting text before the trailing control', async () => {
      const wrapper = await mount({ trailingSupportingText: '12' }, { trailing: () => 'T' })
      const trailing = wrapper.find('.ui-list-item__trailing')

      expect(trailing.text()).toBe('12T')
      expect(trailing.element.firstElementChild!.className).toBe('ui-list-item__trailing-supporting')
    })

    it('opens the trailing column for trailing supporting text alone', async () => {
      const wrapper = await mount({ trailingSupportingText: '12' })

      expect(wrapper.find('.ui-list-item__trailing').exists()).toBe(true)
    })
  })

  describe('state modifiers', () => {
    it('marks an interactive row', async () => {
      for (const props of [{ interactive: true }, { tag: 'button' }, { tag: 'a' }, { to: '/inbox' }]) {
        const wrapper = await mount(props)
        expect(wrapper.classes()).toContain('ui-list-item--interactive')
      }
    })

    it('leaves a static row unmarked, whatever element draws it', async () => {
      const wrapper = await mount({ tag: 'label' })

      expect(wrapper.classes()).not.toContain('ui-list-item--interactive')
    })

    it('marks disabled and selected rows', async () => {
      const wrapper = await mount({ interactive: true, disabled: true, selected: true })

      expect(wrapper.classes()).toContain('ui-list-item--disabled')
      expect(wrapper.classes()).toContain('ui-list-item--selected')
    })

    it('treats selected false and undefined alike for the look', async () => {
      const off = await mount({ selected: false })
      expect(off.classes()).not.toContain('ui-list-item--selected')

      const plain = await mount()
      expect(plain.classes()).not.toContain('ui-list-item--selected')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ interactive: true, disabled: true, selected: true })

      expect(Object.keys(wrapper.attributes()).some(name => name.startsWith('data-'))).toBe(false)
    })
  })
})
