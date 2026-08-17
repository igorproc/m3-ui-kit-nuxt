import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MApp from './index.vue'

describe('m-app', () => {
  it('renders a neutral root and the shared overlay host', async () => {
    const wrapper = await mountSuspended(MApp, {
      slots: { default: () => 'Application' },
    })

    // MApp is multi-root: the `.ui-app` boundary + the sibling overlay host.
    const app = wrapper.find('.ui-app')
    expect(app.exists()).toBe(true)
    expect(app.text()).toContain('Application')
    expect(wrapper.findAll('#ui-overlay-host')).toHaveLength(1)
  })

  it('supports a custom root tag without adding a landmark role', async () => {
    const wrapper = await mountSuspended(MApp, {
      props: { tag: 'section' },
    })

    const app = wrapper.find('.ui-app')
    expect(app.element.tagName).toBe('SECTION')
    expect(app.attributes('role')).toBeUndefined()
  })

  it('does not render loading presentation without the loading slot', async () => {
    const wrapper = await mountSuspended(MApp)

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false)
  })

  it('provides readonly loading state to the loading slot', async () => {
    const wrapper = await mountSuspended(MApp, {
      slots: {
        loading: scope => h('output', { 'data-test': 'loading' }, `${scope.progress.value}:${scope.isLoading.value}`),
      },
    })

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true)
  })

  it('warns when a second boundary is mounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const DuplicateRoot = defineComponent({
      setup: () => () => h('div', [h(MApp), h(MApp)]),
    })

    const wrapper = await mountSuspended(DuplicateRoot)

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Only one <MApp>'))

    wrapper.unmount()
    warn.mockRestore()
  })
})
