import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MIconButton from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MIconButton, { props, attrs, slots: { default: () => 'X' } })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-icon · a11y', () => {
  describe('name', () => {
    it('is named by ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Close dialog' })

      expect(wrapper.attributes('aria-label')).toBe('Close dialog')
    })

    it('ships no English default name', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it.each([
      ['aria-label', 'Close'],
      ['aria-labelledby', 'close-label'],
    ])('takes a name through the %s attribute', async (name, value) => {
      const wrapper = await mount({}, { [name]: value })

      expect(wrapper.attributes(name)).toBe(value)
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest resolves to `false`.
  })

  describe('states', () => {
    it('relies on the native button role', async () => {
      const wrapper = await mount({ ariaLabel: 'Close' })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('type')).toBe('button')
    })

    it.each([[true, 'true'], [false, 'false']] as const)('states selected=%s as aria-pressed="%s"', async (selected, pressed) => {
      const wrapper = await mount({ ariaLabel: 'Favourite', selected })

      expect(wrapper.attributes('aria-pressed')).toBe(pressed)
    })

    it('has no aria-pressed on a plain icon button', async () => {
      const wrapper = await mount({ ariaLabel: 'Close' })

      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('leaves the tab order with a native disabled', async () => {
      const wrapper = await mount({ ariaLabel: 'Close', disabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it.each([
      ['loading', { loading: true }],
      ['soft-disabled', { softDisabled: true }],
    ])('keeps a %s icon button focusable through aria-disabled', async (_, props) => {
      const wrapper = await mount({ ariaLabel: 'Next page', ...props })

      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('states loading as aria-busy and hides the spinner', async () => {
      const wrapper = await mount({ ariaLabel: 'Sync', loading: true })

      expect(wrapper.attributes('aria-busy')).toBe('true')
      expect(wrapper.find('.ui-button__spinner').attributes('aria-hidden')).toBe('true')
    })
  })
})
