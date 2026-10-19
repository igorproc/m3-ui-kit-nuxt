import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import { injectHead, useNuxtApp } from '#app'
import { useLoadingIndicator } from '#app/composables/loading-indicator'
import { useMaterialTheme } from '#kit/composables/useMaterialTheme'
import MApp from './index.vue'
import { mAppProps } from './props'

const mounted: Array<{ unmount: () => void }> = []

const mount: typeof mountSuspended = async (component, options) => {
  const wrapper = await mountSuspended(component, options)
  mounted.push(wrapper)
  return wrapper
}

const headTag = async (name: string, id?: string) => {
  const tags = await injectHead().resolveTags()
  return tags.find(tag => tag.tag === name && (id === undefined || tag.props.id === id))
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

describe('m-app', () => {
  it('renders a neutral root and the shared overlay host', async () => {
    const wrapper = await mount(MApp, {
      slots: { default: () => 'Application' },
    })

    // MApp is multi-root: the `.ui-app` boundary + the sibling overlay host.
    const app = wrapper.find('.ui-app')
    expect(app.exists()).toBe(true)
    expect(app.text()).toContain('Application')
    expect(wrapper.findAll('#ui-overlay-host')).toHaveLength(1)
  })

  it('supports a custom root tag without adding a landmark role', async () => {
    const wrapper = await mount(MApp, {
      props: { tag: 'section' },
    })

    const app = wrapper.find('.ui-app')
    expect(app.element.tagName).toBe('SECTION')
    expect(app.attributes('role')).toBeUndefined()
  })

  it('declares its props through the kit props factory', () => {
    expect(mAppProps.tag.default).toBe('div')
    expect(mAppProps.skipLinkLabel.default).toBeUndefined()
    expect(mAppProps.skipLinkTarget.default).toBe('main')
  })

  it('passes fallthrough attributes to the root', async () => {
    const wrapper = await mount(MApp, {
      attrs: { 'class': 'shell', 'data-test': 'app' },
    })

    const app = wrapper.find('.ui-app')
    expect(app.classes()).toContain('shell')
    expect(app.attributes('data-test')).toBe('app')
  })

  it('exposes the live root element after mount', async () => {
    const app = ref<{ rootElement: HTMLElement | null } | null>(null)
    const Host = defineComponent({
      setup: () => () => h(MApp, { ref: app }),
    })

    const wrapper = await mount(Host)

    expect(app.value?.rootElement).toBeInstanceOf(HTMLElement)
    expect(app.value?.rootElement).toBe(wrapper.find('.ui-app').element)
  })

  it('writes the theme attributes and the palette CSS into the document head', async () => {
    const theme = useMaterialTheme()
    await mount(MApp)

    const html = await headTag('htmlAttrs')
    expect(html?.props).toMatchObject({
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
    await mount(MApp)

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

  it('does not render loading presentation without the loading slot', async () => {
    const wrapper = await mount(MApp)

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false)
    expect(wrapper.find('.ui-app').text()).toBe('')
  })

  it('provides readonly loading state to the loading slot', async () => {
    const wrapper = await mount(MApp, {
      slots: {
        loading: scope => h('output', { 'data-test': 'loading' }, `${scope.progress}:${scope.isLoading}`),
      },
    })

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true)
  })

  it('re-renders the loading slot when a route starts and stops loading', async () => {
    const wrapper = await mount(MApp, {
      slots: {
        loading: scope => h('output', { 'data-test': 'loading' }, String(scope.isLoading)),
      },
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

  it('renders no skip link without a label', async () => {
    const wrapper = await mount(MApp, {
      props: { skipLinkTarget: 'content' },
    })

    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('renders the skip link first, pointing at the target', async () => {
    const wrapper = await mount(MApp, {
      props: { skipLinkLabel: 'Skip to content', skipLinkTarget: 'content' },
      slots: { default: () => h('button', 'Menu') },
    })

    const link = wrapper.find('.ui-app__skip-link')
    expect(link.element.tagName).toBe('A')
    expect(link.text()).toBe('Skip to content')
    expect(link.attributes('href')).toBe('#content')
    expect(wrapper.find('.ui-app').element.firstElementChild).toBe(link.element)
  })

  it('points the skip link at #main by default', async () => {
    const wrapper = await mount(MApp, {
      props: { skipLinkLabel: 'Skip to content' },
    })

    expect(wrapper.find('.ui-app__skip-link').attributes('href')).toBe('#main')
  })

  it('does not warn for a single boundary, including after a remount', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const first = await mountSuspended(MApp)
    first.unmount()
    await mount(MApp)

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Only one <MApp>'))

    warn.mockRestore()
  })

  it('warns when a second boundary is mounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const DuplicateRoot = defineComponent({
      setup: () => () => h('div', [h(MApp), h(MApp)]),
    })

    await mount(DuplicateRoot)

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Only one <MApp>'))

    warn.mockRestore()
  })
})
