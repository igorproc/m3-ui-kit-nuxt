import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h, nextTick, ref } from 'vue'
import type { Component } from 'vue'
import MLazy from './index.vue'
import type { MLazySlotState } from './props'

class FakeObserver {
  static instances: FakeObserver[] = []

  readonly targets = new Set<Element>()

  constructor(readonly callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
  }

  takeRecords() {
    return []
  }

  emit(target: Element, isIntersecting: boolean) {
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

const Endless = defineAsyncComponent(() => new Promise<Component>(() => {}))
const Broken = defineAsyncComponent(() => Promise.reject(new Error('offline')))
const content = () => h('div', { class: 'content' }, 'Content')
const ERROR_COPY = { errorText: 'Could not load', retryLabel: 'Try again' }

enableAutoUnmount(afterEach)

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'requestIdleCallback')
  Reflect.deleteProperty(window, 'cancelIdleCallback')
})

describe('m-lazy', () => {
  it('renders the root class, the status modifier and fallthrough attributes', async () => {
    const wrapper = await mountSuspended(MLazy, {
      attrs: { 'class': 'feed-item', 'data-test': 'lazy' },
      slots: { default: content, placeholder: () => h('div', { class: 'placeholder' }, 'Waiting') },
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-lazy', 'ui-lazy--idle', 'feed-item']))
    expect(wrapper.attributes('data-test')).toBe('lazy')
    expect(wrapper.find('.placeholder').exists()).toBe(true)
    expect(wrapper.find('.content').exists()).toBe(false)
  })

  it('activates eagerly and resolves synchronous content', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'eager' },
      slots: { default: content },
    })
    await nextTick()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-lazy--active')
    expect(wrapper.classes()).not.toContain('ui-lazy--animated')
    expect(wrapper.emitted('resolve')).toHaveLength(1)
  })

  it('activates manually through the placeholder slot state', async () => {
    const Harness = defineComponent({
      setup: () => () => h(MLazy, null, {
        default: content,
        placeholder: (state: MLazySlotState) =>
          h('button', { class: 'activate', onClick: state.activate }, 'Activate'),
      }),
    })
    const wrapper = await mountSuspended(Harness)

    await wrapper.find('.activate').trigger('click')
    await flushPromises()

    expect(wrapper.find('.content').exists()).toBe(true)
  })

  it('activates near the viewport through one observer shared by every boundary', async () => {
    const Harness = defineComponent({
      setup: () => () => h('div', [1, 2, 3].map(index => h(MLazy, { key: index, minHeight: 40 }, { default: content }))),
    })
    const wrapper = await mountSuspended(Harness)
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
      slots: {
        default: content,
        placeholder: () => h('button', { class: 'focus-target' }, 'Load'),
      },
    })

    await wrapper.find('.focus-target').trigger('focusin')
    await nextTick()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.emitted('activate')?.[0]?.[0]).toMatchObject({ reason: 'interaction' })
  })

  it('turns the boundary into a keyboard activator when the placeholder has no control', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'on-interaction', interactions: ['click'] },
      slots: { default: content, placeholder: () => 'Load comments' },
    })

    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.classes()).toContain('ui-lazy--activator')

    await wrapper.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('ui-lazy--activator')
  })

  it('activates after the idle callback', async () => {
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: (callback: () => void) => {
        callback()
        return 1
      },
    })
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'on-idle', timeout: 50 },
      slots: { default: content },
    })

    await flushPromises()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.emitted('activate')?.[0]?.[0]).toMatchObject({ reason: 'idle' })
  })

  it('fades in only what arrives after the boundary waited on the client', async () => {
    const deferred = await mountSuspended(MLazy, { slots: { default: content } })
    const still = await mountSuspended(MLazy, { props: { transition: false }, slots: { default: content } })

    expect(deferred.classes()).toContain('ui-lazy--animated')
    expect(still.classes()).not.toContain('ui-lazy--animated')
  })

  it('supports a controlled reset and reserves layout space', async () => {
    const active = ref(true)
    const Harness = defineComponent({
      setup: () => () => h(MLazy, {
        'active': active.value,
        'minWidth': 120,
        'minHeight': '240px',
        'once': false,
        'onUpdate:active': (value: boolean | undefined) => {
          active.value = value as boolean
        },
      }, {
        default: content,
        placeholder: () => h('div', { class: 'placeholder' }, 'Waiting'),
      }),
    })
    const wrapper = await mountSuspended(Harness)
    const lazy = wrapper.find('.ui-lazy')

    expect(lazy.attributes('style')).toContain('min-width: 120rem')
    expect(lazy.attributes('style')).toContain('min-height: 240px')
    expect(wrapper.find('.content').exists()).toBe(true)

    active.value = false
    await flushPromises()

    expect(wrapper.find('.placeholder').exists()).toBe(true)
    expect(wrapper.find('.content').exists()).toBe(false)
  })

  it('is busy while pending and keeps the placeholder until the fallback delay passes', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'on-interaction' },
      slots: {
        default: () => h(Endless),
        placeholder: () => h('div', { class: 'placeholder' }, 'Waiting'),
        fallback: () => h('div', { class: 'fallback' }, 'Loading'),
      },
    })
    vi.useFakeTimers()

    await wrapper.trigger('click')
    await nextTick()

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.classes()).toContain('ui-lazy--pending')
    expect(wrapper.emitted('pending')).toHaveLength(1)
    expect(wrapper.find('.placeholder').exists()).toBe(true)

    vi.advanceTimersByTime(200)
    await nextTick()

    expect(wrapper.find('.fallback').exists()).toBe(true)
    expect(wrapper.find('.placeholder').exists()).toBe(false)
  })

  it('keeps the placeholder for the whole wait when there is no fallback slot', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'eager' },
      slots: { default: () => h(Endless), placeholder: () => h('div', { class: 'placeholder' }, 'Waiting') },
    })
    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.find('.placeholder').exists()).toBe(true)
    expect(wrapper.find('.ui-lazy__fallback').exists()).toBe(false)
  })

  it('announces a failure in an always-mounted alert and offers a named retry', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'eager', ...ERROR_COPY },
      slots: { default: () => h(Broken) },
    })
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)

    await flushPromises()

    expect(wrapper.classes()).toContain('ui-lazy--error')
    expect(wrapper.find('[role="alert"]').text()).toBe('Could not load')
    expect(wrapper.find('[role="alert"]').element).toBe(alert.element)
    expect(wrapper.find('button').text()).toBe('Try again')
    expect(wrapper.emitted('error')?.[0]?.[0]).toMatchObject({ message: 'offline' })
  })

  it('remounts the content on retry', async () => {
    let calls = 0
    const Flaky = defineAsyncComponent(() => {
      calls += 1
      return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(defineComponent({ setup: () => content }))
    })
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'eager', ...ERROR_COPY },
      slots: { default: () => h(Flaky) },
    })
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toBe('')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('hands the error and retry to the #error slot instead of the built-in alert', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'eager' },
      slots: {
        default: () => h(Broken),
        error: (state: MLazySlotState & { error: unknown }) =>
          h('p', { class: 'custom-error' }, `${(state.error as Error).message}:${state.status}`),
      },
    })
    await flushPromises()

    expect(wrapper.find('.custom-error').text()).toBe('offline:error')
    expect(wrapper.find('.ui-lazy__alert').exists()).toBe(false)
  })
})
