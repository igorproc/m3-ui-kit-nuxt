import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MIcon from '../index.vue'
import type { MIconName } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: { name: MIconName, filled?: boolean, label?: string }, attrs: Record<string, string> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MIcon, { props, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-icon · a11y', () => {
  describe('decorative', () => {
    it('is hidden from assistive tech without a label: no role, no name', async () => {
      const wrapper = await mount({ name: 'home' })

      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('treats an empty label as no label', async () => {
      const wrapper = await mount({ name: 'home', label: '' })

      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('accepts an explicit aria-hidden from the owner', async () => {
      const wrapper = await mount({ name: 'home' }, { 'aria-hidden': 'true' })

      expect(wrapper.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('meaningful', () => {
    it('is a named image with a label and is not hidden', async () => {
      const wrapper = await mount({ name: 'error', label: 'Error' })

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Error')
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    })

    it('ships the role and the name in the server HTML', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MIcon, { name: 'error', label: 'Error' }) }))

      expect(html).toContain('role="img"')
      expect(html).toContain('aria-label="Error"')
    })
  })

  describe('glyph', () => {
    it.each([undefined, 'Home'])('keeps the glyph itself out of the tree and out of the Tab order (label %s)', async (label) => {
      const wrapper = await mount({ name: 'home', label })
      const glyph = wrapper.find('.iconify')

      expect(glyph.exists()).toBe(true)
      expect(glyph.attributes('aria-hidden')).toBe('true')
      expect(glyph.attributes('focusable')).toBe('false')
    })
  })

  // The name warnings are guarded by `import.meta.dev`, which Vitest resolves to `false`;
  // `utils/icon/iconName.spec.ts` covers the messages themselves.
})
