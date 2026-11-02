import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MAvatar from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAvatar, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
  vi.restoreAllMocks()
})

describe('m-avatar · interaction', () => {
  describe('load and error', () => {
    it('emits load and keeps the image', async () => {
      const wrapper = await mount({ src: '/a.webp' })

      await wrapper.find('.ui-avatar__image').trigger('load')

      expect(wrapper.emitted('load')).toHaveLength(1)
      expect(wrapper.find('.ui-avatar__image').exists()).toBe(true)
    })

    it('emits a replayed load only once per source', async () => {
      const wrapper = await mount({ src: '/a.webp' })
      const image = wrapper.find('.ui-avatar__image')

      await image.trigger('load')
      await image.trigger('load')

      expect(wrapper.emitted('load')).toHaveLength(1)
    })

    it('emits error once per source and shows the fallback', async () => {
      const wrapper = await mount({ src: '/broken.webp', name: 'Ada Lovelace' })

      await wrapper.find('.ui-avatar__image').trigger('error')

      expect(wrapper.emitted('error')).toHaveLength(1)
      expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
      expect(wrapper.find('.ui-avatar__initials').text()).toBe('AL')
    })

    it('hands the failure event to #fallback', async () => {
      const wrapper = await mount({ src: '/broken.webp' }, { fallback: ({ error }: { error?: Event }) => h('span', { class: 'why' }, error?.type ?? 'none') })

      await wrapper.find('.ui-avatar__image').trigger('error')

      expect(wrapper.find('.why').text()).toBe('error')
    })

    it('retries only the new source after a failure', async () => {
      const wrapper = await mount({ src: '/broken.webp' })
      await wrapper.find('.ui-avatar__image').trigger('error')
      expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)

      await wrapper.setProps({ src: '/next.webp' })

      expect(wrapper.find('.ui-avatar__image').attributes('src')).toBe('/next.webp')
    })

    it('keeps a failed source failed when it comes back', async () => {
      const wrapper = await mount({ src: '/broken.webp', name: 'Ada' })
      await wrapper.find('.ui-avatar__image').trigger('error')

      await wrapper.setProps({ name: 'Ada Lovelace' })

      expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
      expect(wrapper.find('.ui-avatar__initials').text()).toBe('AL')
    })

    it('ignores a stale event fired for an obsolete source', async () => {
      const wrapper = await mount({ src: '/a.webp' })
      const image = wrapper.find('.ui-avatar__image')
      // A late event still carrying the previous source.
      image.element.setAttribute('src', '/old.webp')

      await image.trigger('error')
      expect(wrapper.emitted('error')).toBeUndefined()
      expect(wrapper.find('.ui-avatar__image').exists()).toBe(true)

      await image.trigger('load')
      expect(wrapper.emitted('load')).toBeUndefined()
    })

    it('does not emit a synthetic error for a missing source', async () => {
      const wrapper = await mount({ name: 'Ada' })

      expect(wrapper.emitted('error')).toBeUndefined()
    })
  })

  describe('hydration replay', () => {
    it('falls back when the image failed before the listeners were attached', async () => {
      vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
      vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0)
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockRejectedValue(new Error('broken'))

      const wrapper = await mount({ src: '/broken.webp', name: 'Ada Lovelace' })
      await flushPromises()

      expect(wrapper.emitted('error')).toHaveLength(1)
      expect(wrapper.find('.ui-avatar__initials').text()).toBe('AL')
    })

    it('reports a load that settled before the listeners were attached, once', async () => {
      vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
      vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(40)

      const wrapper = await mount({ src: '/a.webp' })
      await wrapper.find('.ui-avatar__image').trigger('load')

      expect(wrapper.emitted('load')).toHaveLength(1)
    })

    it('treats a complete image without pixels as loaded when it decodes (a size-less SVG)', async () => {
      vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
      vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0)
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined)

      const wrapper = await mount({ src: '/mark.svg' })
      await flushPromises()

      expect(wrapper.emitted('load')).toHaveLength(1)
      expect(wrapper.emitted('error')).toBeUndefined()
    })
  })
})
