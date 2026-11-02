import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import MSplitButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

const menu = () => h(MMenuItem, { label: 'Save as draft' })

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'Save' }) {
  if (current) current.unmount()
  current = await mountSuspended(MSplitButton, { props: { trailingAriaLabel: 'More', ...props }, slots })

  return current as VueWrapper
}

const action = (wrapper: VueWrapper) => wrapper.find('.ui-split-button__action')
const trailing = (wrapper: VueWrapper) => wrapper.find('.ui-split-button__trailing')
const halves = (wrapper: VueWrapper) => [action(wrapper), trailing(wrapper)]
const trailingIcon = (wrapper: VueWrapper) => trailing(wrapper).findAllComponents({ name: 'MIcon' }).at(0)?.props('name')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-split · variants', () => {
  it('renders the action and the trailing button, each an MButton', async () => {
    const wrapper = await mount()

    expect(wrapper.find('.ui-split-button').exists()).toBe(true)
    expect(action(wrapper).classes()).toContain('ui-button')
    expect(trailing(wrapper).classes()).toContain('ui-button')
    expect(action(wrapper).text()).toBe('Save')
  })

  describe('variant', () => {
    it.each(['filled', 'tonal', 'elevated', 'outlined'] as const)('passes %s to both buttons', async (variant) => {
      const wrapper = await mount({ variant })

      expect(halves(wrapper).every(half => half.classes().includes(`ui-button--${variant}`))).toBe(true)
    })

    it('defaults to filled', async () => {
      const wrapper = await mount()

      expect(action(wrapper).classes()).toContain('ui-button--filled')
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('passes %s to both buttons', async (color) => {
      const wrapper = await mount({ color })

      expect(halves(wrapper).every(half => half.classes().includes(`ui-button--${color}`))).toBe(true)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(action(wrapper).classes()).toContain('ui-button--primary')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('puts %s on the root and on both buttons', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-split-button--${density}`)
      expect(halves(wrapper).every(half => half.classes().includes(`ui-button--${density}`))).toBe(true)
    })

    it('defaults to the default step', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-split-button--default')
    })
  })

  describe('slots', () => {
    it('passes a leading icon to the action button', async () => {
      const wrapper = await mount({}, { default: () => 'Save', prepend: () => 'I' })

      expect(action(wrapper).find('.ui-button__icon--prepend').text()).toBe('I')
    })

    it('draws no leading icon box without the prepend slot', async () => {
      const wrapper = await mount()

      expect(action(wrapper).find('.ui-button__icon--prepend').exists()).toBe(false)
    })

    it('draws the trailing button icon-only with the down chevron', async () => {
      const wrapper = await mount()

      expect(trailing(wrapper).classes()).toContain('ui-button--icon-only')
      expect(trailingIcon(wrapper)).toBe(ICONS.keyboardArrowDown)
    })

    it('turns the chevron up while the menu is open', async () => {
      const wrapper = await mount({}, { default: () => 'Save', menu })

      await trailing(wrapper).trigger('click')

      expect(trailingIcon(wrapper)).toBe(ICONS.keyboardArrowUp)
    })

    it('lets the consumer replace the trailing icon and hands it the open state', async () => {
      const wrapper = await mount({}, { default: () => 'Save', menu, trailing: ({ open }: { open: boolean }) => (open ? 'open' : 'closed') })

      expect(trailing(wrapper).text()).toBe('closed')
      await trailing(wrapper).trigger('click')
      expect(trailing(wrapper).text()).toBe('open')
    })
  })

  describe('states', () => {
    it('disables both buttons', async () => {
      const wrapper = await mount({ disabled: true })

      expect(halves(wrapper).every(half => half.classes().includes('ui-button--disabled'))).toBe(true)
    })

    it('loads on the action and holds the trailing one in the disabled look', async () => {
      const wrapper = await mount({ loading: true })

      expect(action(wrapper).find('.ui-loading--inline').exists()).toBe(true)
      expect(action(wrapper).classes()).toContain('ui-button--loading')
      expect(trailing(wrapper).classes()).toContain('ui-button--disabled')
      expect(trailing(wrapper).classes()).not.toContain('ui-button--loading')
    })
  })
})
