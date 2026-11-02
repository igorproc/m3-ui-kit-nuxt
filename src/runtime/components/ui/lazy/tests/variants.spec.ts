import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import MLazy from '../index.vue'
import type { MLazySlotState } from '../props'
import { Broken, ERROR_COPY, FakeObserver, content, placeholder, removeIdleCallback } from './helpers'

enableAutoUnmount(afterEach)

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  removeIdleCallback()
})

describe('m-lazy · variants', () => {
  describe('root', () => {
    it('renders the root class, the idle modifier and fallthrough attributes', async () => {
      const wrapper = await mountSuspended(MLazy, {
        attrs: { 'class': 'feed-item', 'data-test': 'lazy' },
        slots: { default: content, placeholder },
      })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-lazy', 'ui-lazy--idle', 'feed-item']))
      expect(wrapper.attributes('data-test')).toBe('lazy')
    })
  })

  describe('mode', () => {
    it.each(['on-idle', 'on-view', 'on-interaction'] as const)('waits with the placeholder in %s mode', async (mode) => {
      const wrapper = await mountSuspended(MLazy, { props: { mode }, slots: { default: content, placeholder } })

      expect(wrapper.classes()).toContain('ui-lazy--idle')
      expect(wrapper.find('.ui-lazy__placeholder .placeholder').exists()).toBe(true)
      expect(wrapper.find('.content').exists()).toBe(false)
    })

    it('renders the content at once in eager mode, without a fade', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager' }, slots: { default: content, placeholder } })
      await nextTick()

      expect(wrapper.classes()).toContain('ui-lazy--active')
      expect(wrapper.classes()).not.toContain('ui-lazy--animated')
      expect(wrapper.find('.ui-lazy__content .content').exists()).toBe(true)
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })

    it.each(['on-idle', 'on-view', 'on-interaction'] as const)('renders the content at once when disabled, whatever the %s mode', async (mode) => {
      const wrapper = await mountSuspended(MLazy, { props: { mode, disabled: true }, slots: { default: content, placeholder } })
      await nextTick()

      expect(wrapper.classes()).toContain('ui-lazy--active')
      expect(wrapper.find('.content').exists()).toBe(true)
    })
  })

  describe('reserved size', () => {
    it('reads a number as rem and passes a string through', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { minWidth: 120, minHeight: '240px' }, slots: { default: content } })
      const style = wrapper.attributes('style')

      expect(style).toContain('min-width: 120rem')
      expect(style).toContain('min-height: 240px')
    })

    it('reserves nothing without a size', async () => {
      const wrapper = await mountSuspended(MLazy, { slots: { default: content } })

      expect(wrapper.attributes('style')).toBeUndefined()
    })
  })

  describe('transition', () => {
    it('fades in only what arrives after the boundary waited on the client', async () => {
      const deferred = await mountSuspended(MLazy, { slots: { default: content } })
      const still = await mountSuspended(MLazy, { props: { transition: false }, slots: { default: content } })

      expect(deferred.classes()).toContain('ui-lazy--animated')
      expect(still.classes()).not.toContain('ui-lazy--animated')
    })

    it('marks the arriving content itself, not a descendant selector', async () => {
      const wrapper = await mountSuspended(MLazy, {
        slots: { default: content, placeholder: (state: MLazySlotState) => h('button', { class: 'go', onClick: state.activate }, 'Go') },
      })

      await wrapper.find('.go').trigger('click')
      await flushPromises()

      expect(wrapper.find('.ui-lazy__content').classes()).toContain('ui-lazy__reveal')
    })
  })

  describe('slots', () => {
    it('hands the state to the placeholder slot', async () => {
      const wrapper = await mountSuspended(MLazy, {
        slots: { default: content, placeholder: (state: MLazySlotState) => h('i', { class: 'state' }, `${state.status}:${state.isActive}:${state.activation}`) },
      })

      expect(wrapper.find('.state').text()).toBe('idle:false:null')
    })

    it('hands the state to the content slot once active', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'eager' },
        slots: { default: (state: MLazySlotState) => h('i', { class: 'state' }, `${state.status}:${state.isActive}:${state.activation?.reason}`) },
      })
      await nextTick()

      expect(wrapper.find('.state').text()).toBe('active:true:eager')
    })

    it('draws the built-in error, or the #error slot instead of it', async () => {
      const builtIn = await mountSuspended(MLazy, { props: { mode: 'eager', ...ERROR_COPY }, slots: { default: () => h(Broken) } })
      await flushPromises()
      expect(builtIn.classes()).toContain('ui-lazy--error')
      expect(builtIn.find('.ui-lazy__alert .ui-lazy__message').text()).toBe('Could not load')

      const custom = await mountSuspended(MLazy, {
        props: { mode: 'eager' },
        slots: {
          default: () => h(Broken),
          error: (state: MLazySlotState & { error: unknown }) => h('p', { class: 'custom-error' }, `${(state.error as Error).message}:${state.status}`),
        },
      })
      await flushPromises()
      expect(custom.find('.ui-lazy__error .custom-error').text()).toBe('offline:error')
      expect(custom.find('.ui-lazy__alert').exists()).toBe(false)
    })
  })
})
