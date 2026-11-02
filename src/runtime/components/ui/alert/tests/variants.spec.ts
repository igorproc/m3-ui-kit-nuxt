import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MAlert from '../index.vue'
import type { MAlertIconSlot, MAlertProps, MAlertResolvedProps } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  current?.unmount()
  current = await mountSuspended(MAlert, { props, slots, global: { stubs: { transition: false } } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const COLORS = ['info', 'success', 'warning', 'error'] as const
const VARIANTS = ['tonal', 'outlined'] as const

describe('m-alert · variants', () => {
  describe('contracts', () => {
    it('exposes public and resolved prop contracts', () => {
      expectTypeOf<MAlertProps>().toMatchTypeOf<{
        color?: 'info' | 'success' | 'warning' | 'error'
        title?: string
        icon?: string | false
      }>()
      expectTypeOf<MAlertResolvedProps>().toMatchTypeOf<{
        color: 'info' | 'success' | 'warning' | 'error'
        title: string
      }>()
    })
  })

  describe('color × variant', () => {
    it.each(COLORS.flatMap(color => VARIANTS.map(variant => [color, variant] as const)))(
      'renders a %s %s alert with both modifiers',
      async (color, variant) => {
        const wrapper = await mount({ color, variant, text: 'msg' })

        expect(wrapper.classes()).toEqual(expect.arrayContaining([`ui-alert--${color}`, `ui-alert--${variant}`]))
      },
    )

    it('defaults to a tonal info alert on a medium surface', async () => {
      const wrapper = await mount({ text: 'Saved' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-alert--info', 'ui-alert--tonal', 'ui-surface']))
    })

    it('keeps visibility while severity changes', async () => {
      const wrapper = await mount({ color: 'info', text: 'msg' })

      await wrapper.setProps({ color: 'error' })

      expect(wrapper.classes()).toContain('ui-alert--error')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('content', () => {
    it('renders title and text in their own parts', async () => {
      const wrapper = await mount({ title: 'Offline', text: 'Changes are kept.' })

      expect(wrapper.find('.ui-alert__content .ui-alert__title').text()).toBe('Offline')
      expect(wrapper.find('.ui-alert__content .ui-alert__body').text()).toBe('Changes are kept.')
    })

    it('prefers slots over the title/text props', async () => {
      const wrapper = await mount({ title: 'prop title', text: 'prop text' }, { title: () => 'slot title', default: () => 'slot text' })

      expect(wrapper.find('.ui-alert__title').text()).toBe('slot title')
      expect(wrapper.find('.ui-alert__body').text()).toBe('slot text')
    })

    it('renders no content wrapper without title or body', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-alert__content').exists()).toBe(false)
    })
  })

  describe('icon', () => {
    // TH-05: the severity is never told by colour alone.
    it.each([
      ['info', 'ic:outline-info'],
      ['success', 'ic:outline-check-circle'],
      ['warning', 'ic:outline-warning-amber'],
      ['error', 'ic:outline-error'],
    ] as const)('shows the %s icon by default', async (color, name) => {
      const wrapper = await mount({ color, text: 'msg' })

      expect(wrapper.find('.ui-alert__icon').exists()).toBe(true)
      expect(wrapper.html()).toContain(name)
    })

    it('renders an explicit icon and drops it with icon=false', async () => {
      const wrapper = await mount({ icon: 'round-bolt' })
      expect(wrapper.html()).toContain('round-bolt')

      await wrapper.setProps({ icon: false })
      expect(wrapper.find('.ui-alert__icon').exists()).toBe(false)
    })

    it('hands the icon slot the color and the resolved icon', async () => {
      const wrapper = await mount({ color: 'success' }, {
        icon: ({ color, icon }: MAlertIconSlot) => h('svg', { 'class': 'custom-icon', 'data-color': color, 'data-icon': String(icon) }),
      })

      const icon = wrapper.get('.custom-icon')
      expect(icon.attributes('data-color')).toBe('success')
      expect(icon.attributes('data-icon')).toBe('ic:outline-check-circle')
    })
  })

  describe('closable', () => {
    it.each([
      [true, true],
      [false, false],
    ] as const)('closable=%s renders the close control and modifier: %s', async (closable, rendered) => {
      const wrapper = await mount({ closable })

      expect(wrapper.find('.ui-alert__close').exists()).toBe(rendered)
      expect(wrapper.classes().includes('ui-alert--closable')).toBe(rendered)
    })

    it('ignores the close slot when the alert is not closable', async () => {
      const wrapper = await mount({}, { close: () => h('button', { class: 'custom-close' }, 'x') })

      expect(wrapper.find('.custom-close').exists()).toBe(false)
    })
  })

  describe('actions', () => {
    it('renders actions straight into the alert, without a wrapper', async () => {
      const bare = await mount({ text: 'msg' })
      expect(bare.find('.retry').exists()).toBe(false)

      const wrapper = await mount({ color: 'error' }, { actions: () => h('button', { class: 'retry' }, 'Retry') })
      expect(wrapper.find('.ui-alert__actions').exists()).toBe(false)
      expect(wrapper.get('.retry').element.parentElement).toBe(wrapper.element)
    })
  })
})
