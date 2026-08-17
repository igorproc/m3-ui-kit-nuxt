import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MLazy from './index.vue'

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(window, 'requestIdleCallback')
  Reflect.deleteProperty(window, 'cancelIdleCallback')
})

describe('m-lazy', () => {
  it('renders a placeholder before activation', async () => {
    const wrapper = await mountSuspended(MLazy, {
      slots: {
        default: () => h('div', { class: 'content' }, 'Content'),
        placeholder: () => h('div', { class: 'placeholder' }, 'Waiting'),
      },
    })

    expect(wrapper.find('.placeholder').exists()).toBe(true)
    expect(wrapper.find('.content').exists()).toBe(false)
  })

  it('activates eagerly and resolves synchronous content', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'eager' },
      slots: { default: () => h('div', { class: 'content' }, 'Content') },
    })
    await nextTick()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.emitted('resolve')).toHaveLength(1)
  })

  it('activates manually through the placeholder slot state', async () => {
    const Harness = defineComponent({
      setup: () => () => h(MLazy, null, {
        default: () => h('div', { class: 'content' }, 'Content'),
        placeholder: (state: { activate: () => void }) =>
          h('button', { class: 'activate', onClick: state.activate }, 'Activate'),
      }),
    })
    const wrapper = await mountSuspended(Harness)

    await wrapper.find('.activate').trigger('click')
    await nextTick()

    expect(wrapper.find('.content').exists()).toBe(true)
  })

  it('activates on configured interaction', async () => {
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'on-interaction', interactions: ['focus'] },
      slots: {
        default: () => h('div', { class: 'content' }, 'Content'),
        placeholder: () => h('button', { class: 'focus-target' }, 'Load'),
      },
    })

    await wrapper.find('.focus-target').trigger('focusin')
    await nextTick()

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.emitted('activate')?.[0]?.[0]).toMatchObject({ reason: 'interaction' })
  })

  it('activates after the idle fallback timeout', async () => {
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: (callback: () => void) => {
        callback()
        return 1
      },
    })
    const wrapper = await mountSuspended(MLazy, {
      props: { mode: 'on-idle', timeout: 50 },
      slots: { default: () => h('div', { class: 'content' }, 'Content') },
    })

    await nextTick()

    expect(wrapper.find('.content').exists()).toBe(true)
  })

  it('supports controlled reset and reserves layout space', async () => {
    const active = ref(true)
    const Harness = defineComponent({
      setup: () => () => h(MLazy, {
        'active': active.value,
        'minWidth': 120,
        'minHeight': '240px',
        'once': false,
        'onUpdate:active': (value: boolean) => { active.value = value },
      }, {
        default: () => h('div', { class: 'content' }, 'Content'),
        placeholder: () => h('div', { class: 'placeholder' }, 'Waiting'),
      }),
    })
    const wrapper = await mountSuspended(Harness)
    const lazy = wrapper.find('.ui-lazy')

    expect(lazy.attributes('style')).toContain('min-width: 120rem')
    expect(lazy.attributes('style')).toContain('min-height: 240px')

    active.value = false
    await nextTick()

    expect(wrapper.find('.placeholder').exists()).toBe(true)
  })
})
