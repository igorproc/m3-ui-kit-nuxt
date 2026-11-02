import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MExpansionPanel from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MExpansionPanel, { props, slots, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-expansion-panel · a11y', () => {
  describe('accordion wiring', () => {
    it('relies on a native button that never submits', async () => {
      const wrapper = await mount({ title: 'X' })
      const header = wrapper.find('.ui-expansion-panel__header')

      expect(header.attributes('type')).toBe('button')
      expect(header.attributes('role')).toBeUndefined()
    })

    it('ties the button and its region together both ways', async () => {
      const wrapper = await mount({ title: 'X' })
      const header = wrapper.find('.ui-expansion-panel__header')
      const region = wrapper.find('[role="region"]')

      expect(header.attributes('aria-controls')).toBe(region.attributes('id'))
      expect(region.attributes('aria-labelledby')).toBe(header.attributes('id'))
    })

    it.each([[false, 'false'], [true, 'true']] as const)('reports aria-expanded="%s"', async (modelValue, expected) => {
      const wrapper = await mount({ title: 'X', modelValue })

      expect(wrapper.find('.ui-expansion-panel__header').attributes('aria-expanded')).toBe(expected)
    })

    it('labels the region by a consumer id on the button', async () => {
      const wrapper = await mount({ title: 'X' }, undefined, { id: 'shipping' })

      expect(wrapper.find('[role="region"]').attributes('aria-labelledby')).toBe('shipping')
    })
  })

  describe('collapsed content', () => {
    it('keeps it inert instead of aria-hidden, so nothing inside can take focus', async () => {
      const wrapper = await mount({ title: 'X', modelValue: false }, { default: () => h('a', { href: '#field' }, 'Field') })
      const region = wrapper.find('[role="region"]')

      expect(region.attributes('inert')).toBeDefined()
      expect(region.attributes('aria-hidden')).toBeUndefined()
    })

    it('lifts inert once open', async () => {
      const wrapper = await mount({ title: 'X', modelValue: true })

      expect(wrapper.find('[role="region"]').attributes('inert')).toBeUndefined()
    })
  })

  describe('naming', () => {
    it('is named by its title, inside the button', async () => {
      const wrapper = await mount({ title: 'Shipping' })

      expect(wrapper.find('.ui-expansion-panel__header').text()).toContain('Shipping')
    })

    it('puts only phrasing content inside the header button', async () => {
      const wrapper = await mount({ title: 'X', description: 'Y' })

      expect(wrapper.find('.ui-expansion-panel__header').findAll('div')).toHaveLength(0)
    })

    it('hides the chevron from assistive tech — aria-expanded already says it', async () => {
      const wrapper = await mount({ title: 'X' })
      const chevron = wrapper.find('.ui-expansion-panel__chevron')

      expect(chevron.attributes('aria-hidden')).toBe('true')
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })

  describe('heading', () => {
    it('wraps the button in a native heading, as the APG Accordion asks', async () => {
      const wrapper = await mount({ title: 'X', headingLevel: 3 })
      const heading = wrapper.find('h3')

      expect(heading.attributes('role')).toBeUndefined()
      expect(heading.element.firstElementChild).toBe(wrapper.find('.ui-expansion-panel__header').element)
    })
  })

  describe('disabled', () => {
    it('disables the native button, which takes it out of the tab order', async () => {
      const wrapper = await mount({ title: 'X', disabled: true })
      const header = wrapper.find('.ui-expansion-panel__header')

      expect(header.attributes('disabled')).toBeDefined()
      expect(header.attributes('aria-disabled')).toBeUndefined()
    })
  })
})
