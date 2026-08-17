import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MLoading from './index.vue'

describe('m-loading', () => {
  it('renders with role=status and the default circular type', async () => {
    const wrapper = await mountSuspended(MLoading)

    const root = wrapper.find('.ui-loading')
    expect(root.exists()).toBe(true)
    expect(root.attributes('role')).toBe('status')
    expect(root.classes()).toContain('ui-loading--circular')
    expect(root.classes()).toContain('ui-loading--medium')
  })

  it('renders the circular spinner markup for type=circular', async () => {
    const wrapper = await mountSuspended(MLoading, {
      props: { type: 'circular' },
    })

    expect(wrapper.find('.ui-loading__spinner').exists()).toBe(true)
    expect(wrapper.find('.ui-loading__expressive').exists()).toBe(false)
  })

  it('renders the expressive morphing shape for type=expressive', async () => {
    const wrapper = await mountSuspended(MLoading, {
      props: { type: 'expressive' },
    })

    expect(wrapper.classes()).toContain('ui-loading--expressive')
    expect(wrapper.find('.ui-loading__expressive').exists()).toBe(true)
    expect(wrapper.find('.ui-loading__spinner').exists()).toBe(false)
  })

  it.each(['small', 'medium', 'large'] as const)(
    'maps the %s size prop to a class',
    async (size) => {
      const wrapper = await mountSuspended(MLoading, { props: { size } })

      expect(wrapper.classes()).toContain(`ui-loading--${size}`)
    },
  )

  it('applies the inline modifier class', async () => {
    const wrapper = await mountSuspended(MLoading, { props: { inline: true } })

    expect(wrapper.classes()).toContain('ui-loading--inline')
  })

  it('uses the default and custom accessible label', async () => {
    const def = await mountSuspended(MLoading)
    expect(def.find('.ui-loading').attributes('aria-label')).toBe('Loading')

    const custom = await mountSuspended(MLoading, {
      props: { ariaLabel: 'Fetching results' },
    })
    expect(custom.find('.ui-loading').attributes('aria-label')).toBe('Fetching results')
  })
})
