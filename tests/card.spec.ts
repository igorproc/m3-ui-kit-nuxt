import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MCard from '../app/components/ui/card/index.vue'

describe('m-card', () => {
  it('renders an <article> with the elevated variant by default', async () => {
    const wrapper = await mountSuspended(MCard)

    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.classes()).toContain('ui-card')
    expect(wrapper.classes()).toContain('ui-card--elevated')
  })

  it('maps the surface-style variant prop to a modifier class', async () => {
    for (const variant of ['elevated', 'filled', 'outlined'] as const) {
      const wrapper = await mountSuspended(MCard, { props: { variant } })
      expect(wrapper.classes()).toContain(`ui-card--${variant}`)
    }
  })

  it('renders the default slot inside the content region', async () => {
    const wrapper = await mountSuspended(MCard, {
      slots: { default: () => 'Body' },
    })

    expect(wrapper.find('.ui-card__content').text()).toBe('Body')
  })

  it('renders title and subtitle props in the header', async () => {
    const wrapper = await mountSuspended(MCard, {
      props: { title: 'Hello', subtitle: 'World' },
    })

    expect(wrapper.find('.ui-card__header').exists()).toBe(true)
    expect(wrapper.find('.ui-card__title').text()).toBe('Hello')
    expect(wrapper.find('.ui-card__subtitle').text()).toBe('World')
  })

  it('omits the header when neither title nor header slot is provided', async () => {
    const wrapper = await mountSuspended(MCard)

    expect(wrapper.find('.ui-card__header').exists()).toBe(false)
  })

  it('renders media, header and actions slots only when provided', async () => {
    const bare = await mountSuspended(MCard)
    expect(bare.find('.ui-card__media').exists()).toBe(false)
    expect(bare.find('.ui-card__actions').exists()).toBe(false)

    const withSlots = await mountSuspended(MCard, {
      slots: {
        media: () => 'M',
        header: () => 'H',
        actions: () => 'A',
      },
    })
    expect(withSlots.find('.ui-card__media').text()).toBe('M')
    expect(withSlots.find('.ui-card__header').text()).toBe('H')
    expect(withSlots.find('.ui-card__actions').text()).toBe('A')
  })
})
