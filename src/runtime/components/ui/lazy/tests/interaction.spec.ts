import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h, nextTick, ref } from 'vue'
import MLazy from '../index.vue'
import type { MLazySlotState } from '../props'
import { Broken, ERROR_COPY, Endless, FakeObserver, content, installIdleCallback, placeholder, removeIdleCallback } from './helpers'

enableAutoUnmount(afterEach)

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  removeIdleCallback()
})

describe('m-lazy · interaction', () => {
  describe('activation', () => {
    it('activates eagerly and resolves synchronous content', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager' }, slots: { default: content } })
      await nextTick()

      expect(wrapper.find('.content').exists()).toBe(true)
      expect(wrapper.emitted('resolve')).toHaveLength(1)
    })

    it('activates manually through the placeholder slot state', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MLazy, null, {
          default: content,
          placeholder: (state: MLazySlotState) => h('button', { class: 'activate', onClick: state.activate }, 'Activate'),
        }),
      }))

      await wrapper.find('.activate').trigger('click')
      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
    })

    it('activates near the viewport through one observer shared by every boundary', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h('div', [1, 2, 3].map(index => h(MLazy, { key: index, minHeight: 40 }, { default: content }))),
      }))
      await nextTick()

      expect(FakeObserver.instances).toHaveLength(1)
      expect(FakeObserver.instances[0]!.targets.size).toBe(3)

      const [first] = wrapper.findAllComponents(MLazy)
      FakeObserver.instances[0]!.emit(first!.element, true)
      await flushPromises()

      expect(first!.emitted('visible')).toHaveLength(1)
      expect(first!.emitted('activate')?.[0]?.[0]).toMatchObject({ reason: 'view' })
      expect(wrapper.findAll('.content')).toHaveLength(1)
      expect(FakeObserver.instances[0]!.targets.size).toBe(2)
    })

    it('activates on a configured interaction', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction', interactions: ['focus'] },
        slots: { default: content, placeholder: () => h('button', { class: 'focus-target' }, 'Load') },
      })

      await wrapper.find('.focus-target').trigger('focusin')
      await nextTick()

      expect(wrapper.find('.content').exists()).toBe(true)
      expect(wrapper.emitted('activate')?.[0]?.[0]).toMatchObject({ reason: 'interaction' })
    })

    it('ignores an interaction it was not configured for', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction', interactions: ['click'] },
        slots: { default: content, placeholder },
      })

      await wrapper.trigger('pointerenter')
      await nextTick()

      expect(wrapper.find('.content').exists()).toBe(false)
    })

    it('activates after the idle callback', async () => {
      installIdleCallback()
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'on-idle', timeout: 50 }, slots: { default: content } })

      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
      expect(wrapper.emitted('activate')?.[0]?.[0]).toMatchObject({ reason: 'idle' })
    })

    it.each(['Enter', ' '])('activates a keyboard activator on %j', async (key) => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction', interactions: ['click'] },
        slots: { default: content, placeholder: () => 'Load comments' },
      })

      await wrapper.trigger('keydown', { key })
      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
    })
  })

  // B9.7a: without `v-model:active` the local model has to release the content too.
  describe('once: false without a bound model', () => {
    it('unmounts the content when the boundary leaves the viewport, and mounts it again on return', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { once: false, minHeight: 40 }, slots: { default: content, placeholder } })
      await nextTick()
      const observer = FakeObserver.instances[0]!

      observer.emit(wrapper.element, true)
      await flushPromises()
      expect(wrapper.find('.content').exists()).toBe(true)

      observer.emit(wrapper.element, false)
      await flushPromises()
      expect(wrapper.find('.content').exists()).toBe(false)
      expect(wrapper.find('.placeholder').exists()).toBe(true)
      expect(wrapper.classes()).toContain('ui-lazy--idle')

      observer.emit(wrapper.element, true)
      await flushPromises()
      expect(wrapper.find('.content').exists()).toBe(true)
    })

    it('keeps watching the boundary after the first activation', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { once: false }, slots: { default: content, placeholder } })
      await nextTick()
      const observer = FakeObserver.instances[0]!

      observer.emit(wrapper.element, true)
      await flushPromises()

      expect(observer.targets.has(wrapper.element)).toBe(true)
    })

    it('stops watching after the first activation with once', async () => {
      const wrapper = await mountSuspended(MLazy, { slots: { default: content, placeholder } })
      await nextTick()
      const observer = FakeObserver.instances[0]!

      observer.emit(wrapper.element, true)
      await flushPromises()
      observer.emit(wrapper.element, false)
      await flushPromises()

      expect(observer.targets.has(wrapper.element)).toBe(false)
      expect(wrapper.find('.content').exists()).toBe(true)
    })
  })

  describe('v-model:active', () => {
    it('supports a controlled reset', async () => {
      const active = ref(true)
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MLazy, {
          'active': active.value,
          'once': false,
          'onUpdate:active': (value: boolean | undefined) => {
            active.value = value as boolean
          },
        }, { default: content, placeholder }),
      }))
      expect(wrapper.find('.content').exists()).toBe(true)

      active.value = false
      await flushPromises()

      expect(wrapper.find('.placeholder').exists()).toBe(true)
      expect(wrapper.find('.content').exists()).toBe(false)
    })

    it('reports an activation back to the model', async () => {
      const active = ref(false)
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MLazy, {
          'active': active.value,
          'onUpdate:active': (value: boolean | undefined) => {
            active.value = value as boolean
          },
        }, {
          default: content,
          placeholder: (state: MLazySlotState) => h('button', { class: 'activate', onClick: state.activate }, 'Activate'),
        }),
      }))

      await wrapper.find('.activate').trigger('click')
      await flushPromises()

      expect(active.value).toBe(true)
    })

    it('activates when the model turns true', async () => {
      const active = ref(false)
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(MLazy, { active: active.value }, { default: content, placeholder }),
      }))

      active.value = true
      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
    })
  })

  describe('pending', () => {
    it('is pending and keeps the placeholder until the fallback delay passes', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction' },
        slots: { default: () => h(Endless), placeholder, fallback: () => h('div', { class: 'fallback' }, 'Loading') },
      })
      vi.useFakeTimers()

      await wrapper.trigger('click')
      await nextTick()

      expect(wrapper.classes()).toContain('ui-lazy--pending')
      expect(wrapper.emitted('pending')).toHaveLength(1)
      expect(wrapper.find('.placeholder').exists()).toBe(true)

      vi.advanceTimersByTime(200)
      await nextTick()

      expect(wrapper.find('.fallback').exists()).toBe(true)
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })

    it('keeps the placeholder for the whole wait when there is no fallback slot', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager' }, slots: { default: () => h(Endless), placeholder } })
      vi.useFakeTimers()

      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(wrapper.find('.placeholder').exists()).toBe(true)
      expect(wrapper.find('.ui-lazy__fallback').exists()).toBe(false)
    })
  })

  describe('failure', () => {
    it('emits the error and switches to the error state', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager', ...ERROR_COPY }, slots: { default: () => h(Broken) } })

      await flushPromises()

      expect(wrapper.classes()).toContain('ui-lazy--error')
      expect(wrapper.emitted('error')?.[0]?.[0]).toMatchObject({ message: 'offline' })
    })

    it('remounts the content on retry', async () => {
      let calls = 0
      const Flaky = defineAsyncComponent(() => {
        calls += 1
        return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(defineComponent({ setup: () => content }))
      })
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager', ...ERROR_COPY }, slots: { default: () => h(Flaky) } })
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').text()).toBe('')
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('hands retry to the #error slot', async () => {
      let calls = 0
      const Flaky = defineAsyncComponent(() => {
        calls += 1
        return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(defineComponent({ setup: () => content }))
      })
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'eager' },
        slots: {
          default: () => h(Flaky),
          error: (state: MLazySlotState) => h('button', { class: 'again', onClick: state.retry }, 'Again'),
        },
      })
      await flushPromises()

      await wrapper.find('.again').trigger('click')
      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
    })
  })
})
