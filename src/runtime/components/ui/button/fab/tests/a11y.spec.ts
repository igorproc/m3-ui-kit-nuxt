import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MFab from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MFab, { props, attrs, slots: { default: () => 'icon' } })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-fab · a11y', () => {
  describe('name', () => {
    it('is named by ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Add item' })

      expect(wrapper.attributes('aria-label')).toBe('Add item')
    })

    it('ships no English default name', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('takes a name through aria-labelledby', async () => {
      const wrapper = await mount({}, { 'aria-labelledby': 'compose-label' })

      expect(wrapper.attributes('aria-labelledby')).toBe('compose-label')
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest resolves to `false`.
  })

  describe('states', () => {
    it('relies on the native button role and has no pressed state', async () => {
      const wrapper = await mount({ ariaLabel: 'Add' })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('leaves the tab order with a native disabled', async () => {
      const wrapper = await mount({ ariaLabel: 'Add', disabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })

    it('keeps a loading FAB focusable: aria-disabled and aria-busy, no native disabled', async () => {
      const wrapper = await mount({ ariaLabel: 'Add', loading: true })

      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.attributes()).toMatchObject({ 'aria-disabled': 'true', 'aria-busy': 'true' })
    })

    it('hides the spinner from assistive tech', async () => {
      const wrapper = await mount({ ariaLabel: 'Add', loading: true })

      expect(wrapper.find('.ui-fab__spinner').attributes('aria-hidden')).toBe('true')
    })
  })
})
