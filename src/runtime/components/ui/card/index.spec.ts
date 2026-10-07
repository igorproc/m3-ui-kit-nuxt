import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MCard from './index.vue'

describe('m-card', () => {
  it('renders a static <article> with the elevated variant by default', async () => {
    const wrapper = await mountSuspended(MCard)

    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.classes()).toEqual(['ui-card', 'ui-card--elevated'])
  })

  it('maps the surface-style variant prop to a modifier class', async () => {
    for (const variant of ['elevated', 'filled', 'outlined'] as const) {
      const wrapper = await mountSuspended(MCard, { props: { variant } })
      expect(wrapper.classes()).toContain(`ui-card--${variant}`)
    }
  })

  it.each([['tonal', 'filled'], ['text', 'outlined']] as const)(
    'still draws the retired %s variant as %s',
    async (retired, replacement) => {
      const wrapper = await mountSuspended(MCard, { props: { variant: retired as never } })

      expect(wrapper.classes()).toContain(`ui-card--${replacement}`)
    },
  )

  it('is neither a link nor a Tab stop without tag="link"', async () => {
    const wrapper = await mountSuspended(MCard, { props: { title: 'Static', to: '/next' } })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('[tabindex]').exists()).toBe(false)
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('ui-card--link')
  })

  it('names the article by its title', async () => {
    const wrapper = await mountSuspended(MCard, { props: { title: 'Hello' } })
    const title = wrapper.find('.ui-card__title')

    expect(title.attributes('id')).toBeTruthy()
    expect(wrapper.attributes('aria-labelledby')).toBe(title.attributes('id'))
  })

  it('does not point at a title the header slot replaced', async () => {
    const wrapper = await mountSuspended(MCard, {
      props: { title: 'Hello' },
      slots: { header: () => 'Custom' },
    })

    expect(wrapper.find('.ui-card__title').exists()).toBe(false)
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
  })

  it('leaves the article unnamed without a title', async () => {
    const wrapper = await mountSuspended(MCard, { props: { subtitle: 'Only a subhead' } })

    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
  })

  it('renders the title as a paragraph unless a heading level is given', async () => {
    const plain = await mountSuspended(MCard, { props: { title: 'Hello' } })
    expect(plain.find('.ui-card__title').element.tagName).toBe('P')

    const heading = await mountSuspended(MCard, { props: { title: 'Hello', headingLevel: 3 } })
    expect(heading.find('.ui-card__title').element.tagName).toBe('H3')
  })

  it('renders title and subtitle props in the header', async () => {
    const wrapper = await mountSuspended(MCard, {
      props: { title: 'Hello', subtitle: 'World' },
    })

    expect(wrapper.find('header.ui-card__header').exists()).toBe(true)
    expect(wrapper.find('.ui-card__title').text()).toBe('Hello')
    expect(wrapper.find('.ui-card__subtitle').text()).toBe('World')
  })

  it('renders a subhead without a title (CT-07)', async () => {
    const wrapper = await mountSuspended(MCard, { props: { subtitle: 'World' } })

    expect(wrapper.find('.ui-card__header').exists()).toBe(true)
    expect(wrapper.find('.ui-card__title').exists()).toBe(false)
    expect(wrapper.find('.ui-card__subtitle').text()).toBe('World')
  })

  it('omits the header when neither title, subtitle nor header slot is provided', async () => {
    const wrapper = await mountSuspended(MCard)

    expect(wrapper.find('.ui-card__header').exists()).toBe(false)
  })

  it('renders the content region only for a default slot (CT-07)', async () => {
    const bare = await mountSuspended(MCard, { props: { title: 'Hello' } })
    expect(bare.find('.ui-card__content').exists()).toBe(false)

    const withBody = await mountSuspended(MCard, {
      slots: { default: () => 'Body' },
    })
    expect(withBody.find('.ui-card__content').text()).toBe('Body')
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
    expect(withSlots.find('footer.ui-card__actions').text()).toBe('A')
  })

  it('reserves the media box at the given aspect ratio (CT-09)', async () => {
    const wrapper = await mountSuspended(MCard, {
      props: { mediaAspectRatio: '16 / 9' },
      slots: { media: () => h('img', { alt: '' }) },
    })

    expect(wrapper.find('.ui-card__media').attributes('style')).toContain('aspect-ratio: 16 / 9')
  })

  it('leaves the media box to its content without an aspect ratio', async () => {
    const wrapper = await mountSuspended(MCard, { slots: { media: () => h('img', { alt: '' }) } })

    expect(wrapper.find('.ui-card__media').attributes('style')).toBeUndefined()
  })

  describe('link card', () => {
    it('makes the whole card one link to the destination', async () => {
      const wrapper = await mountSuspended(MCard, { props: { tag: 'link', to: '/next', title: 'Go' } })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBe('/next')
      expect(wrapper.classes()).toContain('ui-card--link')
      expect(wrapper.classes()).not.toContain('ui-card--disabled')
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })

    it('is named by its title, not by all of its content', async () => {
      const wrapper = await mountSuspended(MCard, {
        props: { tag: 'link', to: '/next', title: 'Go', subtitle: 'Somewhere' },
        slots: { default: () => 'Long supporting text' },
      })

      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-card__title').attributes('id'))
    })

    it('falls back to its content for a name without a title', async () => {
      const titleless = await mountSuspended(MCard, {
        props: { tag: 'link', to: '/next', subtitle: 'Somewhere' },
      })
      expect(titleless.attributes('aria-labelledby')).toBeUndefined()

      const replaced = await mountSuspended(MCard, {
        props: { tag: 'link', to: '/next', title: 'Go' },
        slots: { header: () => 'Custom' },
      })
      expect(replaced.attributes('aria-labelledby')).toBeUndefined()
    })

    it('draws its parts with plain elements, not landmarks', async () => {
      const wrapper = await mountSuspended(MCard, {
        props: { tag: 'link', to: '/next', title: 'Go' },
        slots: { actions: () => 'A' },
      })

      expect(wrapper.find('header').exists()).toBe(false)
      expect(wrapper.find('footer').exists()).toBe(false)
      expect(wrapper.find('div.ui-card__header').exists()).toBe(true)
    })

    it('still renders its actions as given', async () => {
      const wrapper = await mountSuspended(MCard, {
        props: { tag: 'link', to: '/next' },
        slots: { actions: () => h('button', { type: 'button' }, 'Share') },
      })

      expect(wrapper.find('.ui-card__actions button').text()).toBe('Share')
    })

    it('loses its destination when disabled but stays a link to assistive tech', async () => {
      const wrapper = await mountSuspended(MCard, { props: { tag: 'link', to: '/next', disabled: true } })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBeUndefined()
      expect(wrapper.attributes('tabindex')).toBeUndefined()
      expect(wrapper.attributes('role')).toBe('link')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.classes()).toContain('ui-card--disabled')
    })
  })

  it('ignores disabled on a static card', async () => {
    const wrapper = await mountSuspended(MCard, { props: { disabled: true } })

    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('ui-card--disabled')
  })
})
