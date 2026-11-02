import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MProgress from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>, attrs?: Record<string, unknown>) {
  current?.unmount()
  current = await mountSuspended(MProgress, { props, slots, attrs })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-progress · a11y', () => {
  describe.each(['linear', 'circular'] as const)('%s', (type) => {
    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.

    it('exposes the progressbar role with its bounds and value', async () => {
      const wrapper = await mount({ type, value: 40, ariaLabel: 'Upload' })
      const bar = wrapper.find('[role="progressbar"]')

      expect(bar.attributes('aria-valuemin')).toBe('0')
      expect(bar.attributes('aria-valuemax')).toBe('100')
      expect(bar.attributes('aria-valuenow')).toBe('40')
    })

    it('takes the consumer’s accessible name', async () => {
      const wrapper = await mount({ type, ariaLabel: 'Upload' })

      expect(wrapper.find('[role="progressbar"]').attributes('aria-label')).toBe('Upload')
    })

    // The kit ships no English copy: an unnamed bar is named by its caller.
    it('invents no name of its own', async () => {
      const wrapper = await mount({ type })

      expect(wrapper.find('[role="progressbar"]').attributes('aria-label')).toBeUndefined()
    })

    it('reports its max and a value text', async () => {
      const wrapper = await mount({ type, value: 3, max: 7, valueText: '3 из 7 файлов', ariaLabel: 'Upload' })
      const bar = wrapper.find('[role="progressbar"]')

      expect(bar.attributes('aria-valuemax')).toBe('7')
      expect(bar.attributes('aria-valuenow')).toBe('3')
      expect(bar.attributes('aria-valuetext')).toBe('3 из 7 файлов')
    })

    it('reports no value while indeterminate', async () => {
      const wrapper = await mount({ type, indeterminate: true, ariaLabel: 'Sync' })

      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined()
    })

    it.each([
      [100 / 3, 100, '33'],
      [3, 7, '3'],
      [1 / 3, 1, '0.33'],
      [2.5, 10, '2.5'],
      [333.3, 1000, '333'],
    ])('reports %d of %d as %s', async (value, max, now) => {
      const wrapper = await mount({ type, value, max, ariaLabel: 'Upload' })

      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe(now)
    })

    it('names the progressbar by its slot caption, which sits outside the role', async () => {
      const wrapper = await mount({ type, value: 30 }, { default: () => 'Uploading 3 files' })
      const bar = wrapper.find('[role="progressbar"]')
      const label = wrapper.find('.ui-progress__label')

      expect(bar.attributes('aria-labelledby')).toBe(label.attributes('id'))
      expect(bar.find('.ui-progress__label').exists()).toBe(false)
      expect(label.text()).toBe('Uploading 3 files')
    })

    it('wires no labelledby without a caption', async () => {
      const wrapper = await mount({ type, value: 30, ariaLabel: 'Upload' })

      expect(wrapper.find('[role="progressbar"]').attributes('aria-labelledby')).toBeUndefined()
    })

    it('hands ARIA and data attributes to the progressbar, class and style to the root', async () => {
      const wrapper = await mount({ type, value: 30 }, undefined, {
        'class': 'host-progress',
        'style': 'margin: 0',
        'aria-labelledby': 'heading',
        'data-test': 'bar',
      })
      const bar = wrapper.find('[role="progressbar"]')

      expect(wrapper.classes()).toContain('host-progress')
      expect(wrapper.attributes('style')).toContain('margin: 0')
      expect(bar.attributes('aria-labelledby')).toBe('heading')
      expect(bar.attributes('data-test')).toBe('bar')
      expect(bar.classes()).not.toContain('host-progress')
    })
  })
})
