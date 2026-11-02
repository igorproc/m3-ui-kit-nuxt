import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MApp from '../index.vue'
import { mAppProps } from '../props'

let current: { unmount: () => void } | null = null

async function mount(options: Parameters<typeof mountSuspended>[1] = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MApp, options)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-app · variants', () => {
  describe('defaults', () => {
    it('declares its props through the kit props factory', () => {
      expect(mAppProps.tag.default).toBe('div')
      expect(mAppProps.skipLinkLabel.default).toBeUndefined()
      expect(mAppProps.skipLinkTarget.default).toBe('main')
    })

    it('renders a neutral div root holding the content and one shared overlay host', async () => {
      const wrapper = await mount({ slots: { default: () => 'Application' } })
      const app = wrapper.find('.ui-app')

      expect(app.element.tagName).toBe('DIV')
      expect(app.text()).toContain('Application')
      expect(wrapper.findAll('#ui-overlay-host')).toHaveLength(1)
    })
  })

  describe('tag', () => {
    it.each(['div', 'section', 'article'])('tag=%s renders that root element', async (tag) => {
      const wrapper = await mount({ props: { tag } })

      expect(wrapper.find('.ui-app').element.tagName).toBe(tag.toUpperCase())
    })
  })

  describe('attributes', () => {
    it('passes fallthrough attributes to the root', async () => {
      const wrapper = await mount({ attrs: { 'class': 'shell', 'data-test': 'app' } })
      const app = wrapper.find('.ui-app')

      expect(app.classes()).toContain('shell')
      expect(app.attributes('data-test')).toBe('app')
    })

    it('exposes the live root element after mount', async () => {
      const app = ref<{ rootElement: HTMLElement | null } | null>(null)

      if (current) current.unmount()
      current = await mountSuspended(defineComponent({ setup: () => () => h(MApp, { ref: app }) }))
      const wrapper = current as VueWrapper

      expect(app.value?.rootElement).toBeInstanceOf(HTMLElement)
      expect(app.value?.rootElement).toBe(wrapper.find('.ui-app').element)
    })
  })

  describe('skip link', () => {
    it('renders no skip link without a label', async () => {
      const wrapper = await mount({ props: { skipLinkTarget: 'content' } })

      expect(wrapper.find('a').exists()).toBe(false)
    })

    it('points at #main by default', async () => {
      const wrapper = await mount({ props: { skipLinkLabel: 'Skip to content' } })

      expect(wrapper.find('.ui-app__skip-link').attributes('href')).toBe('#main')
    })

    it.each(['content', 'page-body'])('points at the given target #%s', async (skipLinkTarget) => {
      const wrapper = await mount({ props: { skipLinkLabel: 'Skip to content', skipLinkTarget } })

      expect(wrapper.find('.ui-app__skip-link').attributes('href')).toBe(`#${skipLinkTarget}`)
    })
  })

  describe('loading slot', () => {
    it('renders no loading presentation without the slot', async () => {
      const wrapper = await mount()

      expect(wrapper.find('[data-test="loading"]').exists()).toBe(false)
      expect(wrapper.find('.ui-app').text()).toBe('')
    })

    it('hands the readonly loading state to the slot', async () => {
      const wrapper = await mount({
        slots: { loading: (scope: { progress: number, isLoading: boolean }) => h('output', { 'data-test': 'loading' }, `${scope.progress}:${scope.isLoading}`) },
      })

      expect(wrapper.find('[data-test="loading"]').text()).toBe('0:false')
    })
  })
})
