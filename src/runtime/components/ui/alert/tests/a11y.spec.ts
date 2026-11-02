import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MAlert from '../index.vue'

/** Past the region's clear-then-write delay. */
const announced = () => new Promise(resolve => setTimeout(resolve, 150))

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MAlert, { props, global: { stubs: { transition: false } } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
  document.querySelectorAll('.ui-live-region').forEach(node => node.remove())
})

describe('m-alert · a11y', () => {
  // W51: a region mounted with its text is not reliably announced, so the
  // alert writes its message into the layer's persistent region instead.
  describe('announcement', () => {
    it('is a labelled group, not a live region itself', async () => {
      const wrapper = await mount({ title: 'Offline', text: 'msg' })

      expect(wrapper.attributes('role')).toBe('group')
      expect(wrapper.attributes('aria-live')).toBeUndefined()
    })

    it.each([
      [{}, 'polite'],
      [{ color: 'error' }, 'assertive'],
      [{ color: 'error', announce: 'polite' }, 'polite'],
      [{ announce: 'assertive' }, 'assertive'],
    ] as const)('%o announces its message through the %s region', async (props, politeness) => {
      await mount({ title: 'Offline', text: 'Changes are kept.', ...props })
      await announced()

      expect(document.querySelector(`.ui-live-region__${politeness}`)!.textContent).toBe('Offline Changes are kept.')
    })

    it('announces nothing with announce off', async () => {
      await mount({ text: 'msg', announce: 'off' })
      await announced()

      const regions = Array.from(document.querySelectorAll('.ui-live-region [role]'))
      expect(regions.every(region => region.textContent === '')).toBe(true)
    })
  })

  describe('relations', () => {
    it('names itself by the title and describes itself by the body', async () => {
      const wrapper = await mount({ title: 'Offline', text: 'Changes are kept.' })

      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-alert__title').attributes('id'))
      expect(wrapper.attributes('aria-describedby')).toBe(wrapper.find('.ui-alert__body').attributes('id'))
    })

    it('wires labelledby/describedby only for rendered content', async () => {
      const wrapper = await mount({ title: 'Offline' })

      expect(wrapper.attributes('aria-describedby')).toBeUndefined()
      expect(wrapper.find('.ui-alert__body').exists()).toBe(false)
    })
  })

  describe('decoration', () => {
    it('hides the icon from assistive tech', async () => {
      const wrapper = await mount({ icon: 'round-bolt' })

      expect(wrapper.find('.ui-alert__icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('close control', () => {
    it('gives the default close control the consumer’s accessible name', async () => {
      const wrapper = await mount({ closable: true, closeLabel: 'Скрыть' })

      expect(wrapper.find('.ui-alert__close').attributes('aria-label')).toBe('Скрыть')
    })

    // A11-04: several dismiss controls on a page must not all read the same.
    it('names the close control after the title it dismisses', async () => {
      const wrapper = await mount({ closable: true, closeLabel: 'Скрыть', title: '  Нет сети ' })

      expect(wrapper.find('.ui-alert__close').attributes('aria-label')).toBe('Скрыть: Нет сети')
    })

    it('hands the close slot the same contextual name', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MAlert, { closable: true, closeLabel: 'Скрыть', title: 'Нет сети' }, {
          close: ({ props }: { props: Record<string, unknown> }) => h('button', props, 'x'),
        }),
      }))

      expect(html).toContain('aria-label="Скрыть: Нет сети"')
    })

    it('keeps the bare label when the title comes from a slot', async () => {
      const wrapper = await mountSuspended(MAlert, {
        props: { closable: true, closeLabel: 'Скрыть' },
        slots: { title: () => 'Нет сети' },
        global: { stubs: { transition: false } },
      })

      expect(wrapper.find('.ui-alert__close').attributes('aria-label')).toBe('Скрыть')
      wrapper.unmount()
    })

    // The kit ships no English copy.
    it('invents no name for the close control', async () => {
      const wrapper = await mount({ closable: true })

      expect(wrapper.find('.ui-alert__close').attributes('aria-label')).toBeUndefined()
    })

    it('hands the close slot an aria-label key the server renders as is', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MAlert, { closable: true, closeLabel: 'Скрыть' }, {
          close: ({ props }: { props: Record<string, unknown> }) => h('button', props, 'x'),
        }),
      }))

      expect(html).toContain('aria-label="Скрыть"')
      expect(html.toLowerCase()).not.toContain('arialabel')
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })
})
