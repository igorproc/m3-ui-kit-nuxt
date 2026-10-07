import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { Suspense, defineAsyncComponent, defineComponent, h, nextTick, reactive, ref } from 'vue'
import type { Component, Ref, VNode } from 'vue'
import { useLazyControl } from './useLazyControl'
import type { LazyControlHooks, LazyControlProps, UseLazyControlReturn } from './useLazyControl'

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

const observer = () => FakeObserver.instances.at(-1)!

const Instant = defineComponent({ setup: () => () => h('input', { 'id': 'field', 'aria-label': 'Draft' }) })
const Endless = defineAsyncComponent(() => new Promise<Component>(() => {}))

interface HarnessOptions {
  props?: Partial<LazyControlProps>
  content?: Component
  placeholder?: () => VNode | string
  active?: Ref<boolean | undefined>
  hooks?: LazyControlHooks
}

function createHarness(options: HarnessOptions = {}) {
  let control: UseLazyControlReturn | null = null
  const active = options.active ?? ref<boolean | undefined>(undefined)
  const props = reactive<LazyControlProps>({
    mode: 'on-view',
    once: true,
    timeout: 2000,
    rootMargin: '200px 0px',
    threshold: 0,
    interactions: ['pointerenter', 'focus', 'click'],
    disabled: false,
    fallbackDelay: 200,
    ...options.props,
  })

  const component = defineComponent({
    setup() {
      const bound = useLazyControl(active, props, options.hooks, { hasFallback: () => true })
      control = bound

      return () => h('div', {
        ...bound.rootAttrs.value,
        id: 'boundary',
        ref: (element: unknown) => {
          bound.root.value = element as HTMLElement | null
        },
      }, [
        bound.view.value === 'placeholder' ? h('i', { id: 'placeholder' }, [options.placeholder?.() ?? 'Waiting']) : null,
        bound.view.value === 'fallback' ? h('i', { id: 'fallback' }, 'Loading') : null,
        bound.isMounted.value
          ? h(Suspense, { ...bound.suspenseAttrs, key: bound.attempt.value }, {
              default: () => h('div', { id: 'content' }, [h(options.content ?? Instant)]),
            })
          : null,
        h('p', bound.alertAttrs, bound.view.value === 'error'
          ? [h('button', { id: 'retry', onClick: bound.retry }, 'Again')]
          : []),
      ])
    },
  })

  return { component, props, active, getControl: () => control! }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useLazyControl', () => {
  it('produces no classes and no data attributes', async () => {
    const { component, getControl } = createHarness({ props: { mode: 'on-interaction' } })
    await mountSuspended(component)

    const bags: object[] = [getControl().rootAttrs.value, getControl().suspenseAttrs, getControl().alertAttrs]
    for (const bag of bags) {
      for (const key of Object.keys(bag)) {
        expect(key).not.toBe('class')
        expect(key.startsWith('data-')).toBe(false)
      }
    }
  })

  it('keeps the alert region mounted in every state', async () => {
    const { component } = createHarness()
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('activates near the viewport and then stops observing when once', async () => {
    const onVisible = vi.fn()
    const onActivate = vi.fn()
    const { component, getControl } = createHarness({ hooks: { onVisible, onActivate } })
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('#placeholder').exists()).toBe(true)
    observer().emit(wrapper.element, true)
    await flushPromises()

    expect(onVisible).toHaveBeenCalledOnce()
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ reason: 'view' }))
    expect(getControl().status.value).toBe('active')
    expect(wrapper.find('#content').exists()).toBe(true)
    expect(observer().targets.size).toBe(0)
  })

  it('marks the boundary busy while the content is pending', async () => {
    const { component, getControl } = createHarness({ props: { mode: 'eager' }, content: Endless })
    const wrapper = await mountSuspended(component)
    await flushPromises()

    expect(getControl().status.value).toBe('pending')
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('makes the boundary a named activator in on-interaction mode', async () => {
    const { component } = createHarness({ props: { mode: 'on-interaction' }, placeholder: () => 'Load comments' })
    const wrapper = await mountSuspended(component)

    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.text()).toContain('Load comments')
  })

  it('does not add a tab stop when the placeholder has its own control', async () => {
    const { component } = createHarness({
      props: { mode: 'on-interaction' },
      placeholder: () => h('button', { type: 'button' }, 'Load'),
    })
    const wrapper = await mountSuspended(component)
    await nextTick()

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it.each(['Enter', ' '])('activates from the keyboard with %j even when focus is not an interaction', async (key) => {
    const onActivate = vi.fn()
    const { component, getControl } = createHarness({
      props: { mode: 'on-interaction', interactions: ['click'] },
      hooks: { onActivate },
    })
    const wrapper = await mountSuspended(component, { attachTo: document.body })

    await wrapper.trigger('focusin')
    expect(getControl().status.value).toBe('idle')

    await wrapper.trigger('keydown', { key })
    await flushPromises()

    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ reason: 'interaction' }))
    expect(getControl().status.value).toBe('active')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBe('-1')
  })

  it('keeps focused content mounted after it leaves the viewport when not once', async () => {
    const { component, getControl } = createHarness({ props: { once: false } })
    const wrapper = await mountSuspended(component, { attachTo: document.body })
    observer().emit(wrapper.element, true)
    await flushPromises()

    const field = wrapper.find<HTMLInputElement>('#field')
    field.element.focus()
    field.element.value = 'typed'
    observer().emit(wrapper.element, false)
    await flushPromises()

    expect(getControl().status.value).toBe('active')
    expect(document.activeElement).toBe(field.element)
    expect(wrapper.find<HTMLInputElement>('#field').element.value).toBe('typed')

    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    await flushPromises()

    expect(getControl().status.value).toBe('idle')
    expect(wrapper.find('#field').exists()).toBe(false)
    outside.remove()
  })

  it('releases unfocused content as soon as it leaves the viewport when not once', async () => {
    const { component, active, getControl } = createHarness({ props: { once: false } })
    const wrapper = await mountSuspended(component)
    observer().emit(wrapper.element, true)
    await flushPromises()
    expect(active.value).toBe(true)

    observer().emit(wrapper.element, false)
    await flushPromises()

    expect(getControl().status.value).toBe('idle')
    expect(active.value).toBe(false)
  })

  it('follows the active model in both directions', async () => {
    const active = ref<boolean | undefined>(false)
    const { component, getControl } = createHarness({ props: { mode: 'on-interaction' }, active })
    const wrapper = await mountSuspended(component)

    active.value = true
    await flushPromises()
    expect(getControl().activation.value).toMatchObject({ reason: 'manual' })
    expect(wrapper.find('#content').exists()).toBe(true)

    active.value = false
    await flushPromises()
    expect(getControl().activation.value).toBeNull()
    expect(wrapper.find('#placeholder').exists()).toBe(true)
  })

  it('swaps the placeholder for the fallback only after the delay', async () => {
    const { component } = createHarness({ props: { mode: 'on-interaction' }, content: Endless })
    const wrapper = await mountSuspended(component)
    vi.useFakeTimers()

    await wrapper.trigger('click')
    await nextTick()
    expect(wrapper.find('#placeholder').exists()).toBe(true)

    vi.advanceTimersByTime(199)
    await nextTick()
    expect(wrapper.find('#fallback').exists()).toBe(false)

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('#fallback').exists()).toBe(true)
    expect(wrapper.find('#placeholder').exists()).toBe(false)
  })

  it('captures a failure, retries with a new attempt and keeps focus inside', async () => {
    let calls = 0
    const Flaky = defineAsyncComponent(() => {
      calls += 1
      return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(Instant)
    })
    const onError = vi.fn()
    const { component, getControl } = createHarness({ props: { mode: 'eager' }, content: Flaky, hooks: { onError } })
    const wrapper = await mountSuspended(component, { attachTo: document.body })
    await flushPromises()

    expect(getControl().status.value).toBe('error')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'offline' }))
    expect(wrapper.find('[role="alert"]').text()).toBe('Again')

    const retry = wrapper.find<HTMLButtonElement>('#retry')
    retry.element.focus()
    await retry.trigger('click')
    await flushPromises()

    expect(getControl().attempt.value).toBe(1)
    expect(getControl().status.value).toBe('active')
    expect(getControl().error.value).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.element)
    expect(wrapper.attributes('tabindex')).toBe('-1')
  })
})
