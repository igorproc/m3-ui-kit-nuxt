import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MBanner from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  current?.unmount()
  current = await mountSuspended(MBanner, { props, slots, global: { stubs: { transition: false } } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const LAYOUTS = ['auto', 'inline', 'stacked'] as const
const VARIANTS = ['plain', 'tonal'] as const

describe('m-banner · variants', () => {
  describe('variant × layout', () => {
    it.each(VARIANTS.flatMap(variant => LAYOUTS.map(layout => [variant, layout] as const)))(
      'renders a %s banner in the %s layout',
      async (variant, layout) => {
        const wrapper = await mount({ variant, layout, title: 'Sync is off' })

        expect(wrapper.classes()).toEqual(expect.arrayContaining([`ui-banner--${variant}`, `ui-banner--${layout}`]))
      },
    )

    it('defaults to an auto-layout plain banner in a section', async () => {
      const wrapper = await mount({ title: 'Sync is off' })

      expect(wrapper.element.tagName).toBe('SECTION')
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-banner--plain', 'ui-banner--auto', 'ui-surface']))
    })
  })

  describe('content', () => {
    it('renders title and body inside the content part', async () => {
      const wrapper = await mount({ title: 'Sync is off', text: 'Local only.' })

      expect(wrapper.find('.ui-banner__content .ui-banner__title').text()).toBe('Sync is off')
      expect(wrapper.find('.ui-banner__content .ui-banner__body').text()).toBe('Local only.')
    })

    it('prefers slots over the title/text props', async () => {
      const wrapper = await mount({ title: 'prop title', text: 'prop text' }, { title: () => 'slot title', default: () => 'slot text' })

      expect(wrapper.find('.ui-banner__title').text()).toBe('slot title')
      expect(wrapper.find('.ui-banner__body').text()).toBe('slot text')
    })

    it('renders no empty wrappers without title, body, actions or close', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-banner__title').exists()).toBe(false)
      expect(wrapper.find('.ui-banner__body').exists()).toBe(false)
      expect(wrapper.find('.ui-banner-actions').exists()).toBe(false)
      expect(wrapper.find('.ui-banner__close').exists()).toBe(false)
    })
  })

  describe('icon', () => {
    it('renders no icon by default and suppresses it with icon=false', async () => {
      const wrapper = await mount({ title: 'Sync is off' })
      expect(wrapper.find('.ui-banner__icon').exists()).toBe(false)

      await wrapper.setProps({ icon: 'round-cloud-off' })
      expect(wrapper.html()).toContain('round-cloud-off')

      await wrapper.setProps({ icon: false })
      expect(wrapper.find('.ui-banner__icon').exists()).toBe(false)
    })

    it('renders the icon slot with the resolved icon', async () => {
      const wrapper = await mount({ icon: 'round-cloud-off' }, {
        icon: ({ icon }: { icon?: string }) => h('i', { 'class': 'glyph', 'data-icon': icon }),
      })

      expect(wrapper.find('.ui-banner__icon .glyph').attributes('data-icon')).toBe('round-cloud-off')
    })

    it.each([
      [{}, undefined, false],
      [{ icon: 'round-cloud-off' }, undefined, true],
      [{ icon: false }, undefined, false],
      [{}, () => h('i', 'glyph'), true],
    ] as const)('%o with an icon slot %s marks the icon column: %s', async (props, icon, marked) => {
      const wrapper = await mount({ title: 'Sync is off', ...props }, icon ? { icon } : undefined)

      expect(wrapper.classes().includes('ui-banner--icon')).toBe(marked)
    })
  })

  describe('actions', () => {
    it.each(LAYOUTS)('mounts the actions leaf with the parent %s layout only when the slot exists', async (layout) => {
      const bare = await mount({ layout })
      expect(bare.find('.ui-banner-actions').exists()).toBe(false)

      const wrapper = await mount({ layout }, { actions: () => h('button', { class: 'act' }, 'Set up') })
      const actions = wrapper.find('.ui-banner-actions')
      expect(actions.classes()).toEqual(expect.arrayContaining(['ui-banner__actions', `ui-banner-actions--${layout}`]))
      expect(actions.find('.act').exists()).toBe(true)
    })

    it('keeps action DOM order stable across layouts', async () => {
      const wrapper = await mount({ layout: 'inline' }, {
        actions: () => [h('button', { class: 'first' }, 'A'), h('button', { class: 'second' }, 'B')],
      })
      const order = () => wrapper.findAll('.ui-banner-actions button').map(button => button.classes()[0])
      expect(order()).toEqual(['first', 'second'])

      await wrapper.setProps({ layout: 'stacked' })
      expect(order()).toEqual(['first', 'second'])
    })
  })

  describe('actions row', () => {
    // In stacked layouts the close control moves onto the actions row, after
    // them, so the screen order matches the Tab order (Q41-В).
    it.each([
      [true, true],
      [false, false],
    ] as const)('marks a banner with actions (actions: %s) for the stacked close placement', async (withActions, marked) => {
      const wrapper = await mount({ closable: true, layout: 'stacked' }, withActions ? { actions: () => h('button', 'Ok') } : {})

      expect(wrapper.classes().includes('ui-banner--actions')).toBe(marked)
    })
  })

  describe('closable', () => {
    it.each([
      [true, true],
      [false, false],
    ] as const)('closable=%s renders the close control: %s', async (closable, rendered) => {
      const wrapper = await mount({ closable })

      expect(wrapper.find('.ui-banner__close').exists()).toBe(rendered)
    })

    it('ignores the close slot when the banner is not closable', async () => {
      const wrapper = await mount({}, { close: () => h('button', { class: 'custom-close' }, 'x') })

      expect(wrapper.find('.custom-close').exists()).toBe(false)
    })
  })
})
