import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { injectHead, useNuxtApp } from '#app'
import { useLoadingIndicator } from '#app/composables/loading-indicator'
import { useMaterialTheme } from '#kit/composables/useMaterialTheme'
import MApp from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(options: Parameters<typeof mountSuspended>[1] = {}, component: Parameters<typeof mountSuspended>[0] = MApp) {
  if (current) current.unmount()
  current = await mountSuspended(component, options)

  return current as VueWrapper
}

const headTag = async (name: string, id?: string) => {
  const tags = await injectHead().resolveTags()
  return tags.find(tag => tag.tag === name && (id === undefined || tag.props.id === id))
}

afterEach(() => {
  current?.unmount()
  current = null
  vi.restoreAllMocks()
})

describe('m-app · interaction', () => {
  describe('theme', () => {
    it('writes the theme attributes and the palette CSS into the document head', async () => {
      const theme = useMaterialTheme()
      await mount()

      expect((await headTag('htmlAttrs'))?.props).toMatchObject({
        'data-definition': theme.htmlAttrs['data-definition'],
        'data-palette': theme.htmlAttrs['data-palette'],
        'data-contrast': theme.htmlAttrs['data-contrast'],
      })

      const style = await headTag('style', 'material-kit-theme')
      expect(style).toBeDefined()
      expect(style?.innerHTML ?? '').toBe(theme.themeCss)
    })

    it('follows a theme change without remounting', async () => {
      const theme = useMaterialTheme()
      const initial = theme.definition
      await mount()

      try {
        theme.definition = 'light'
        await nextTick()
        expect((await headTag('htmlAttrs'))?.props['data-definition']).toBe('light')

        theme.definition = 'dark'
        await nextTick()
        expect((await headTag('htmlAttrs'))?.props['data-definition']).toBe('dark')
      } finally {
        theme.definition = initial
      }
    })

    it('removes its head entry when it unmounts', async () => {
      const wrapper = await mountSuspended(MApp)
      expect(await headTag('style', 'material-kit-theme')).toBeDefined()

      wrapper.unmount()

      expect(await headTag('style', 'material-kit-theme')).toBeUndefined()
    })
  })

  describe('loading', () => {
    it('re-renders the loading slot when a route starts and stops loading', async () => {
      const wrapper = await mount({
        slots: { loading: (scope: { isLoading: boolean }) => h('output', { 'data-test': 'loading' }, String(scope.isLoading)) },
      })
      const output = () => wrapper.find('[data-test="loading"]').text()

      expect(output()).toBe('false')

      await useNuxtApp().callHook('page:loading:start')
      await nextTick()
      expect(output()).toBe('true')

      useLoadingIndicator().finish({ force: true })
      await nextTick()
      expect(output()).toBe('false')
    })
  })

  describe('single boundary', () => {
    it('does not warn for a single boundary, including after a remount', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      const first = await mountSuspended(MApp)
      first.unmount()
      await mount()

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Only one <MApp>'))
    })

    it('warns when a second boundary is mounted', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      await mount({}, defineComponent({ setup: () => () => h('div', [h(MApp), h(MApp)]) }))

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Only one <MApp>'))
    })
  })
})
