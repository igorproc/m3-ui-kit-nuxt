import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MBanner from '../index.vue'

/** Past the region's clear-then-write delay. */
const announced = () => new Promise(resolve => setTimeout(resolve, 150))

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MBanner, { props, global: { stubs: { transition: false } } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
  document.querySelectorAll('.ui-live-region').forEach(node => node.remove())
})

describe('m-banner · a11y', () => {
  describe('role', () => {
    // A banner is a labelled section, never role=alert.
    it('is a native section without an invented role', async () => {
      const wrapper = await mount({ title: 'Sync is off' })

      expect(wrapper.element.tagName).toBe('SECTION')
      expect(wrapper.attributes('role')).toBeUndefined()
    })
  })

  // W51: the banner writes its message into the layer's persistent region
  // instead of being a region mounted together with its text.
  describe('announcement', () => {
    it('is not a live region itself', async () => {
      const wrapper = await mount({ title: 'Terms changed' })

      expect(wrapper.attributes('aria-live')).toBeUndefined()
    })

    it('announces its title and body politely by default', async () => {
      await mount({ title: 'Terms changed', text: 'Review them.' })
      await announced()

      expect(document.querySelector('.ui-live-region__polite')!.textContent).toBe('Terms changed Review them.')
    })

    it('announces nothing with announce off', async () => {
      await mount({ title: 'Terms changed', announce: 'off' })
      await announced()

      const regions = Array.from(document.querySelectorAll('.ui-live-region [role]'))
      expect(regions.every(region => region.textContent === '')).toBe(true)
    })
  })

  describe('relations', () => {
    it('names itself by the title and describes itself by the body', async () => {
      const wrapper = await mount({ title: 'Sync is off', text: 'Local only.' })

      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-banner__title').attributes('id'))
      expect(wrapper.attributes('aria-describedby')).toBe(wrapper.find('.ui-banner__body').attributes('id'))
    })

    it('points at nothing that is not rendered', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
      expect(wrapper.attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('decoration', () => {
    it('hides the icon from assistive tech', async () => {
      const wrapper = await mount({ icon: 'round-cloud-off' })

      expect(wrapper.find('.ui-banner__icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('close control', () => {
    it('gives the default close control the consumer’s accessible name', async () => {
      const wrapper = await mount({ closable: true, closeLabel: 'Скрыть' })

      expect(wrapper.find('.ui-banner__close').attributes('aria-label')).toBe('Скрыть')
    })

    // A11-04: several dismiss controls on a page must not all read the same.
    it('names the close control after the title it dismisses', async () => {
      const wrapper = await mount({ closable: true, closeLabel: 'Скрыть', title: '  Нет сети ' })

      expect(wrapper.find('.ui-banner__close').attributes('aria-label')).toBe('Скрыть: Нет сети')
    })

    it('hands the close slot the same contextual name', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MBanner, { closable: true, closeLabel: 'Скрыть', title: 'Нет сети' }, {
          close: ({ props }: { props: Record<string, unknown> }) => h('button', props, 'x'),
        }),
      }))

      expect(html).toContain('aria-label="Скрыть: Нет сети"')
    })

    it('keeps the bare label when the title comes from a slot', async () => {
      const wrapper = await mountSuspended(MBanner, {
        props: { closable: true, closeLabel: 'Скрыть' },
        slots: { title: () => 'Нет сети' },
        global: { stubs: { transition: false } },
      })

      expect(wrapper.find('.ui-banner__close').attributes('aria-label')).toBe('Скрыть')
      wrapper.unmount()
    })

    // The kit ships no English copy.
    it('invents no name for the close control', async () => {
      const wrapper = await mount({ closable: true })

      expect(wrapper.find('.ui-banner__close').attributes('aria-label')).toBeUndefined()
    })

    it('hands the close slot an aria-label key the server renders as is', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MBanner, { closable: true, closeLabel: 'Скрыть' }, {
          close: ({ props }: { props: Record<string, unknown> }) => h('button', props, 'x'),
        }),
      }))

      expect(html).toContain('aria-label="Скрыть"')
      expect(html.toLowerCase()).not.toContain('arialabel')
    })

    // Q41: actions first, close last — the same order on screen and for Tab.
    it('keeps the close control after the actions in the DOM', async () => {
      const wrapper = await mountSuspended(MBanner, {
        props: { closable: true, closeLabel: 'Скрыть', layout: 'stacked' },
        slots: { actions: () => h('button', { class: 'act' }, 'Set up') },
      })
      const order = wrapper.findAll('button').map(button => button.classes().includes('act') ? 'action' : 'close')

      expect(order).toEqual(['action', 'close'])
      wrapper.unmount()
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })
})
