import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Slots) {
  if (current) current.unmount()
  current = await mountSuspended(MButton, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button · variants', () => {
  it('renders a native button with the base class and the label', async () => {
    const wrapper = await mount({}, { default: () => 'Save' })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.classes()).toContain('ui-button')
    expect(wrapper.find('.ui-button__label').text()).toBe('Save')
  })

  describe('variant', () => {
    it.each(['elevated', 'filled', 'tonal', 'outlined', 'text'] as const)('maps %s onto its modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-button--${variant}`)
    })

    it('defaults to filled', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-button--filled')
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps %s onto its modifier', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-button--${color}`)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-button--primary')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps %s onto its modifier', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-button--${density}`)
    })

    it('defaults to the default step', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-button--default')
    })
  })

  describe('shape', () => {
    it.each(['round', 'square'] as const)('maps %s onto its modifier', async (shape) => {
      const wrapper = await mount({ shape })

      expect(wrapper.classes()).toContain(`ui-button--${shape}`)
    })

    it('defaults to round', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-button--round')
    })
  })

  describe('tag', () => {
    it('is a native button by default', async () => {
      const wrapper = await mount({}, { default: () => 'Save' })

      expect(wrapper.find('button.ui-button').exists()).toBe(true)
    })

    it('is a link with its destination when tag is link', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders' }, { default: () => 'Orders' })

      expect(wrapper.find('a.ui-button').attributes('href')).toBe('/orders')
    })
  })

  describe('slots', () => {
    it('wraps the prepend and append icons and marks the root for each', async () => {
      const wrapper = await mount({}, { default: () => 'Label', prepend: () => 'P', append: () => 'A' })

      expect(wrapper.find('.ui-button__icon--prepend').text()).toBe('P')
      expect(wrapper.find('.ui-button__icon--append').text()).toBe('A')
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-button--has-prepend', 'ui-button--has-append']))
    })

    it('renders no icon boxes and no modifiers without icon slots', async () => {
      const wrapper = await mount({}, { default: () => 'Label' })

      expect(wrapper.find('.ui-button__icon').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-button--has-prepend')
      expect(wrapper.classes()).not.toContain('ui-button--icon-only')
    })

    it.each(['prepend', 'append'] as const)('is icon-only with only a %s icon and draws no empty label box', async (slot) => {
      const wrapper = await mount({}, { [slot]: () => 'I' })

      expect(wrapper.classes()).toContain('ui-button--icon-only')
      expect(wrapper.find('.ui-button__label').exists()).toBe(false)
    })

    it('hands the toggle state to every slot, so a glyph can follow it', async () => {
      const glyph = ({ selected }: { selected: boolean }) => (selected ? 'on' : 'off')
      const wrapper = await mount({ selected: true, variant: 'text' }, { prepend: glyph, default: glyph, append: glyph })

      expect(wrapper.findAll('.ui-button__icon, .ui-button__label').map(node => node.text())).toEqual(['on', 'on', 'on'])

      await wrapper.setProps({ selected: false })
      expect(wrapper.find('.ui-button__label').text()).toBe('off')
    })

    it('hands false to the slots of a plain button', async () => {
      const wrapper = await mount({}, { default: ({ selected }: { selected: boolean }) => String(selected) })

      expect(wrapper.find('.ui-button__label').text()).toBe('false')
    })
  })

  describe('toggle', () => {
    it('is a plain action with neither toggle modifier while selected is unbound', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-button--selected')
      expect(wrapper.classes()).not.toContain('ui-button--unselected')
    })

    it.each([
      [true, 'ui-button--selected', 'ui-button--unselected'],
      [false, 'ui-button--unselected', 'ui-button--selected'],
    ])('selected=%s wears %s', async (selected, present, absent) => {
      const wrapper = await mount({ selected })

      expect(wrapper.classes()).toContain(present)
      expect(wrapper.classes()).not.toContain(absent)
    })

    it('moves a toggle\'s shape and colours on springs; a plain button keeps the stylesheet', async () => {
      const toggle = await mount({ selected: false })
      const transition = (toggle.element as HTMLElement).style.transition

      expect(transition).toContain('border-radius')
      expect(transition).toContain('linear(')

      const plain = await mount()
      expect((plain.element as HTMLElement).style.transition).toBe('')
    })
  })

  describe('states', () => {
    it('wears the disabled modifier when disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-button--disabled')
      expect(wrapper.classes()).not.toContain('ui-button--loading')
    })

    it.each([
      [{ loading: true }, ['ui-button--loading', 'ui-button--disabled']],
      [{ softDisabled: true }, ['ui-button--disabled']],
    ])('%o wears %o', async (props, classes) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toEqual(expect.arrayContaining(classes))
    })

    it('puts the spinner in the prepend icon\'s place, so the width holds', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Save', prepend: () => 'P' })

      expect(wrapper.find('.ui-button__spinner .ui-loading--inline').exists()).toBe(true)
      expect(wrapper.find('.ui-button__icon--prepend').exists()).toBe(false)
      expect(wrapper.find('.ui-button__spinner--centered').exists()).toBe(false)
      expect(wrapper.classes()).toContain('ui-button--has-prepend')
    })

    it('centres the spinner over the label when there is no icon to stand in for', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Save' })

      expect(wrapper.find('.ui-button__spinner--centered').exists()).toBe(true)
      expect(wrapper.find('.ui-button__label').text()).toBe('Save')
    })

    it('keeps the append icon while loading', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Save', append: () => 'A' })

      expect(wrapper.find('.ui-button__icon--append').exists()).toBe(true)
    })

    it('renders no spinner while idle', async () => {
      const wrapper = await mount({}, { default: () => 'Save' })

      expect(wrapper.find('.ui-button__spinner').exists()).toBe(false)
    })
  })
})
