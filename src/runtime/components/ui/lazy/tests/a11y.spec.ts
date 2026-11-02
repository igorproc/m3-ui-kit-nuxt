import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MLazy from '../index.vue'
import { Broken, ERROR_COPY, Endless, FakeObserver, content, placeholder } from './helpers'

enableAutoUnmount(afterEach)

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('m-lazy · a11y', () => {
  describe('keyboard activator', () => {
    it('turns the boundary into a button when the placeholder has no control of its own', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction', interactions: ['click'] },
        slots: { default: content, placeholder: () => 'Load comments' },
      })

      expect(wrapper.attributes('role')).toBe('button')
      expect(wrapper.attributes('tabindex')).toBe('0')
      expect(wrapper.classes()).toContain('ui-lazy--activator')
    })

    it('stops being a button once activated', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction', interactions: ['click'] },
        slots: { default: content, placeholder: () => 'Load comments' },
      })

      await wrapper.trigger('keydown', { key: 'Enter' })
      await flushPromises()

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('tabindex')).toBeUndefined()
      expect(wrapper.classes()).not.toContain('ui-lazy--activator')
    })

    it('leaves the role to a control the placeholder already has', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'on-interaction' },
        slots: { default: content, placeholder: () => h('button', { type: 'button' }, 'Load') },
      })
      await nextTick()

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it.each([
      ['its own control', () => h('button', { type: 'button' }, 'Load')],
      ['no control', () => 'Load comments'],
    ])('ships no activator in the server HTML, the placeholder has %s', async (_, ownPlaceholder) => {
      const html = await renderToString(createSSRApp({
        render: () => h(MLazy, { mode: 'on-interaction' }, { default: content, placeholder: ownPlaceholder }),
      }))

      expect(html).not.toContain('role="button"')
      expect(html).not.toContain('tabindex')
      expect(html).not.toContain('ui-lazy--activator')
    })

    it.each(['on-view', 'eager'] as const)('is never a button in %s mode', async (mode) => {
      const wrapper = await mountSuspended(MLazy, { props: { mode }, slots: { default: content, placeholder } })

      expect(wrapper.attributes('role')).toBeUndefined()
    })
  })

  describe('busy', () => {
    it('reports itself busy while the content is on its way', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'on-interaction' }, slots: { default: () => h(Endless), placeholder } })

      await wrapper.trigger('click')
      await nextTick()

      expect(wrapper.attributes('aria-busy')).toBe('true')
    })

    it('is not busy at rest or once resolved', async () => {
      const idle = await mountSuspended(MLazy, { slots: { default: content, placeholder } })
      expect(idle.attributes('aria-busy')).toBeUndefined()

      const active = await mountSuspended(MLazy, { props: { mode: 'eager' }, slots: { default: content } })
      await nextTick()
      expect(active.attributes('aria-busy')).toBeUndefined()
    })
  })

  describe('failure', () => {
    it('announces a failure in an alert that was mounted before it', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager', ...ERROR_COPY }, slots: { default: () => h(Broken) } })
      const alert = wrapper.find('[role="alert"]')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toBe('')

      await flushPromises()

      expect(wrapper.find('[role="alert"]').element).toBe(alert.element)
      expect(alert.text()).toBe('Could not load')
    })

    it('offers a retry named by the app', async () => {
      const wrapper = await mountSuspended(MLazy, { props: { mode: 'eager', ...ERROR_COPY }, slots: { default: () => h(Broken) } })

      await flushPromises()

      expect(wrapper.find('button').text()).toBe('Try again')
    })

    it('leaves the announcement to an #error slot when there is one', async () => {
      const wrapper = await mountSuspended(MLazy, {
        props: { mode: 'eager' },
        slots: { default: () => h(Broken), error: () => h('p', 'Failed') },
      })

      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // The missing errorText / retryLabel warnings are guarded by `import.meta.dev`,
  // which Vitest resolves to `false`; they cannot be asserted here.
})
