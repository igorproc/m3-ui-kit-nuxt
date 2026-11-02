import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MCard from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MCard, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-card · variants', () => {
  describe('variant', () => {
    it.each(['elevated', 'filled', 'outlined'] as const)('maps %s onto its own modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-card--${variant}`)
    })

    it('defaults to a static elevated article and carries nothing else', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('ARTICLE')
      expect(wrapper.classes()).toEqual(['ui-card', 'ui-card--elevated'])
    })

    it('keeps the variant on a link card', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', variant: 'outlined' })

      expect(wrapper.classes()).toContain('ui-card--outlined')
      expect(wrapper.classes()).toContain('ui-card--link')
    })
  })

  describe('tag', () => {
    it('renders the whole card as one anchor for tag="link"', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', title: 'Go' })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBe('/next')
      expect(wrapper.classes()).toContain('ui-card--link')
    })

    it('stays a static article whatever destination it is handed without tag="link"', async () => {
      const wrapper = await mount({ title: 'Static', to: '/next' })

      expect(wrapper.element.tagName).toBe('ARTICLE')
      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-card--link')
    })
  })

  describe('header', () => {
    it('renders title and subtitle props in a header', async () => {
      const wrapper = await mount({ title: 'Hello', subtitle: 'World' })

      expect(wrapper.find('header.ui-card__header').exists()).toBe(true)
      expect(wrapper.find('.ui-card__title').text()).toBe('Hello')
      expect(wrapper.find('.ui-card__subtitle').text()).toBe('World')
    })

    it('renders a subhead without a title (CT-07)', async () => {
      const wrapper = await mount({ subtitle: 'World' })

      expect(wrapper.find('.ui-card__header').exists()).toBe(true)
      expect(wrapper.find('.ui-card__title').exists()).toBe(false)
      expect(wrapper.find('.ui-card__subtitle').text()).toBe('World')
    })

    it('omits the header when neither title, subtitle nor header slot is given', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-card__header').exists()).toBe(false)
    })

    it('renders the title as a paragraph unless a heading level is given', async () => {
      const wrapper = await mount({ title: 'Hello' })

      expect(wrapper.find('.ui-card__title').element.tagName).toBe('P')
    })

    it.each([2, 3, 4, 5, 6] as const)('renders the title as h%i for headingLevel', async (level) => {
      const wrapper = await mount({ title: 'Hello', headingLevel: level })

      expect(wrapper.find('.ui-card__title').element.tagName).toBe(`H${level}`)
    })

    // Q-5 (M3-polish): rich title content without losing the kit's element.
    it('fills the title element through #title', async () => {
      const wrapper = await mount({ headingLevel: 3 }, { title: () => h('em', 'Rich title') })
      const title = wrapper.find('.ui-card__title')

      expect(title.element.tagName).toBe('H3')
      expect(title.find('em').text()).toBe('Rich title')
    })

    it('lets #header replace title and subtitle whole', async () => {
      const wrapper = await mount({ title: 'Hello', subtitle: 'World' }, { header: () => 'Custom' })

      expect(wrapper.find('.ui-card__header').text()).toBe('Custom')
      expect(wrapper.find('.ui-card__title').exists()).toBe(false)
      expect(wrapper.find('.ui-card__subtitle').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('renders no media, content or actions region unless filled', async () => {
      const wrapper = await mount({ title: 'Hello' })

      expect(wrapper.find('.ui-card__media').exists()).toBe(false)
      expect(wrapper.find('.ui-card__content').exists()).toBe(false)
      expect(wrapper.find('.ui-card__actions').exists()).toBe(false)
    })

    it('renders each region in reading order: media, header, content, actions', async () => {
      const wrapper = await mount({}, {
        media: () => 'M',
        header: () => 'H',
        default: () => 'B',
        actions: () => 'A',
      })
      const order = Array.from((wrapper.element as HTMLElement).children).map(child => child.className)

      expect(order).toEqual(['ui-card__media', 'ui-card__header', 'ui-card__content', 'ui-card__actions'])
      expect(wrapper.find('footer.ui-card__actions').text()).toBe('A')
    })

    it('reserves the media box at the given aspect ratio (CT-09)', async () => {
      const wrapper = await mount({ mediaAspectRatio: '16 / 9' }, { media: () => h('img', { alt: '' }) })

      expect(wrapper.find('.ui-card__media').attributes('style')).toContain('aspect-ratio: 16 / 9')
    })

    it('leaves the media box to its content without an aspect ratio', async () => {
      const wrapper = await mount({}, { media: () => h('img', { alt: '' }) })

      expect(wrapper.find('.ui-card__media').attributes('style')).toBeUndefined()
    })

    it('still renders the actions of a link card as given', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next' }, { actions: () => h('button', { type: 'button' }, 'Share') })

      expect(wrapper.find('.ui-card__actions button').text()).toBe('Share')
    })
  })

  describe('state modifiers', () => {
    it('marks a disabled link card', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', disabled: true })

      expect(wrapper.classes()).toContain('ui-card--disabled')
    })

    it('leaves an enabled link card unmarked', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next' })

      expect(wrapper.classes()).not.toContain('ui-card--disabled')
    })

    it('ignores disabled on a static card — it has no state to lose', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.element.tagName).toBe('ARTICLE')
      expect(wrapper.classes()).not.toContain('ui-card--disabled')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', disabled: true })

      expect(Object.keys(wrapper.attributes()).some(name => name.startsWith('data-'))).toBe(false)
    })
  })
})
