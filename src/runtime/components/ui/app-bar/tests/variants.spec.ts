import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutHeader from '#kit/components/ui/layout/header.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MAppBar from '../index.vue'
import MAppBarNav from '../nav/index.vue'
import MAppBarTitle from '../title/index.vue'
import MAppBarActions from '../actions/index.vue'
import type { MAppBarType } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAppBar, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const TYPES: MAppBarType[] = ['small', 'medium', 'large']
const ALIGNS = ['start', 'center'] as const

async function mountInLayout(bar: () => ReturnType<typeof h>, zone: 'direct' | 'header' | 'main') {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({
    render: () => h(MLayout, null, () => {
      if (zone === 'direct') return [bar(), h(MLayoutMain, () => 'Body')]
      if (zone === 'header') return [h(MLayoutHeader, () => bar()), h(MLayoutMain, () => 'Body')]
      return [h(MLayoutMain, () => bar())]
    }),
  }))

  return (current as VueWrapper).find('.ui-app-bar')
}

describe('m-app-bar · variants', () => {
  describe('type', () => {
    it.each(TYPES)('renders the %s size as its own modifier', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.classes()).toContain(`ui-app-bar--${type}`)
      for (const other of TYPES.filter(size => size !== type)) {
        expect(wrapper.classes()).not.toContain(`ui-app-bar--${other}`)
      }
    })

    it('defaults to small', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-app-bar--small')
    })
  })

  describe('align', () => {
    it('defaults to start: no centre modifier', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-app-bar--center')
    })

    it.each(TYPES.flatMap(type => ALIGNS.map(align => [type, align] as const)))(
      'keeps size %s and alignment %s independent',
      async (type, align) => {
        const wrapper = await mount({ type, align })

        expect(wrapper.classes()).toContain(`ui-app-bar--${type}`)
        expect(wrapper.classes().includes('ui-app-bar--center')).toBe(align === 'center')
      },
    )
  })

  describe('title and subtitle', () => {
    it('renders no headline without a title or a subtitle', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-app-bar__headline').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-app-bar--subtitle')
    })

    it('renders the ready-made title and subtitle and flags the subtitle', async () => {
      const wrapper = await mount({ title: 'Inbox', subtitle: 'unread' })

      expect(wrapper.find('.ui-app-bar__title').text()).toBe('Inbox')
      expect(wrapper.find('.ui-app-bar__subtitle').text()).toBe('unread')
      expect(wrapper.classes()).toContain('ui-app-bar--subtitle')
    })

    it('renders a title alone without the subtitle modifier', async () => {
      const wrapper = await mount({ title: 'Inbox' })

      expect(wrapper.find('.ui-app-bar__subtitle').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-app-bar--subtitle')
    })

    it('renders a subtitle alone with no empty title element', async () => {
      const wrapper = await mount({ subtitle: 'unread' })

      expect(wrapper.find('.ui-app-bar__title').exists()).toBe(false)
      expect(wrapper.find('.ui-app-bar__subtitle').text()).toBe('unread')
    })

    // The bar renders before a composed title reports up; CSS reads this modifier
    // with `:has()`, so the server's first frame already has the taller height.
    it('marks the headline of a composed title with a subtitle in the server HTML', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MAppBar, null, { default: () => h(MAppBarTitle, { title: 'Inbox', subtitle: 'unread' }) }),
      }))

      expect(html).toMatch(/class="ui-app-bar__headline ui-app-bar__headline--subtitle"/)
    })

    it.each(TYPES)('grows the %s bar to its subtitle height variant', async (type) => {
      const wrapper = await mount({ type, title: 'Inbox', subtitle: 'unread' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining([`ui-app-bar--${type}`, 'ui-app-bar--subtitle']))
    })
  })

  describe('slots', () => {
    it('lets the default slot replace the ready-made headline', async () => {
      const wrapper = await mount({ title: 'Ignored' }, { default: () => h('span', { class: 'own' }, 'Own') })

      expect(wrapper.find('.own').text()).toBe('Own')
      expect(wrapper.find('.ui-app-bar__title').exists()).toBe(false)
    })

    it('places the compound nav, title and actions in their own regions, in DOM order', async () => {
      const wrapper = await mount({}, {
        default: () => [
          h(MAppBarNav, null, { default: () => 'N' }),
          h(MAppBarTitle, { title: 'T' }),
          h(MAppBarActions, null, { default: () => 'A' }),
        ],
      })
      const regions = wrapper.findAll('.ui-app-bar__nav, .ui-app-bar__headline, .ui-app-bar__actions')

      expect(regions.map(region => region.classes()[0])).toEqual(['ui-app-bar__nav', 'ui-app-bar__headline', 'ui-app-bar__actions'])
      expect(wrapper.find('.ui-app-bar__nav').text()).toBe('N')
      expect(wrapper.find('.ui-app-bar__title').text()).toBe('T')
      expect(wrapper.find('.ui-app-bar__actions').text()).toBe('A')
    })

    it('reflects the subtitle of a composed MAppBarTitle', async () => {
      const wrapper = await mount({}, { default: () => h(MAppBarTitle, { title: 'X', subtitle: 'Y' }) })

      expect(wrapper.classes()).toContain('ui-app-bar--subtitle')
      expect(wrapper.find('.ui-app-bar__subtitle').text()).toBe('Y')
    })

    it('reflects a subtitle given through the title #subtitle slot', async () => {
      const wrapper = await mount({}, {
        default: () => h(MAppBarTitle, { title: 'X' }, { subtitle: () => h('span', { class: 'own-subtitle' }, 'Y') }),
      })

      expect(wrapper.classes()).toContain('ui-app-bar--subtitle')
      expect(wrapper.find('.own-subtitle').text()).toBe('Y')
    })

    it('lets the title default slot replace the headline text', async () => {
      const wrapper = await mount({}, {
        default: () => h(MAppBarTitle, { title: 'Ignored' }, { default: () => h('span', { class: 'own-title' }, 'Own') }),
      })

      expect(wrapper.find('.own-title').text()).toBe('Own')
      expect(wrapper.find('.ui-app-bar__title').exists()).toBe(false)
    })
  })

  // A11-01: the bar is the page header, unless a header zone already is.
  describe('tag', () => {
    it('is a header element by default', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('HEADER')
    })

    it.each(['header', 'div', 'section'] as const)('renders as <%s> when asked', async (tag) => {
      const wrapper = await mount({ tag })

      expect(wrapper.element.tagName).toBe(tag.toUpperCase())
    })

    it('is a header as a zone of its own in m-layout', async () => {
      const bar = await mountInLayout(() => h(MAppBar, { title: 'Inbox' }), 'direct')

      expect(bar.element.tagName).toBe('HEADER')
    })

    it('is a div inside m-layout-header: one header may not hold another', async () => {
      const bar = await mountInLayout(() => h(MAppBar, { title: 'Inbox' }), 'header')

      expect(bar.element.tagName).toBe('DIV')
    })

    it('keeps an explicit tag inside m-layout-header', async () => {
      const bar = await mountInLayout(() => h(MAppBar, { title: 'Inbox', tag: 'section' }), 'header')

      expect(bar.element.tagName).toBe('SECTION')
    })

    it('is a header inside m-layout-main: the header of a pane', async () => {
      const bar = await mountInLayout(() => h(MAppBar, { title: 'Pane' }), 'main')

      expect(bar.element.tagName).toBe('HEADER')
    })
  })

  // CT-02: a flexible headline wraps to two lines, unless its zone reserves one height.
  describe('wrap', () => {
    it.each<[MAppBarType, boolean]>([
      ['small', false],
      ['medium', true],
      ['large', true],
    ])('a %s bar on its own wraps its headline: %s', async (type, wraps) => {
      const wrapper = await mount({ type, title: 'Inbox' })

      expect(wrapper.classes().includes('ui-app-bar--wrap')).toBe(wraps)
    })

    it.each(['direct', 'header'] as const)('a medium bar in a pinned zone (%s) keeps one line', async (zone) => {
      const bar = await mountInLayout(() => h(MAppBar, { type: 'medium', title: 'Inbox' }), zone)

      expect(bar.classes()).not.toContain('ui-app-bar--wrap')
    })

    it('a collapsing medium bar keeps one line: its height is fixed while it folds', async () => {
      const wrapper = await mount({ type: 'medium', title: 'Inbox', scrollBehavior: 'collapse' })

      expect(wrapper.classes()).not.toContain('ui-app-bar--wrap')
    })

    it('a medium bar in m-layout-main wraps', async () => {
      const bar = await mountInLayout(() => h(MAppBar, { type: 'medium', title: 'Pane' }), 'main')

      expect(bar.classes()).toContain('ui-app-bar--wrap')
    })
  })

  // W65-В: medium and large fold into the small height as the page scrolls.
  describe('scrollBehavior', () => {
    it('is pinned by default: no collapse', async () => {
      const wrapper = await mount({ type: 'medium', title: 'Inbox' })

      expect(wrapper.classes()).not.toContain('ui-app-bar--collapse')
      expect(wrapper.find('.ui-app-bar__collapsed').exists()).toBe(false)
    })

    it.each<[MAppBarType, boolean]>([
      ['small', false],
      ['medium', true],
      ['large', true],
    ])('collapse applies to a %s bar: %s', async (type, collapses) => {
      const wrapper = await mount({ type, title: 'Inbox', scrollBehavior: 'collapse' })

      expect(wrapper.classes().includes('ui-app-bar--collapse')).toBe(collapses)
      expect(wrapper.find('.ui-app-bar__collapsed').exists()).toBe(collapses)
    })

    it('puts the collapsed title in the top row, before the actions', async () => {
      const wrapper = await mount({ type: 'large', title: 'Inbox', scrollBehavior: 'collapse' }, {
        default: () => [h(MAppBarTitle, { title: 'Inbox' }), h(MAppBarActions, null, { default: () => 'A' })],
      })

      expect(wrapper.find('.ui-app-bar__collapsed').text()).toBe('Inbox')
    })

    it('takes the collapsed title from a composed MAppBarTitle', async () => {
      const wrapper = await mount({ type: 'medium', scrollBehavior: 'collapse' }, {
        default: () => h(MAppBarTitle, { title: 'Drafts' }),
      })
      await nextTick()

      expect(wrapper.find('.ui-app-bar__collapsed').text()).toBe('Drafts')
    })

    it('draws no collapsed title when there is no title text to repeat', async () => {
      const wrapper = await mount({ type: 'medium', scrollBehavior: 'collapse' }, {
        default: () => h(MAppBarTitle, null, { default: () => h('span', 'Custom') }),
      })
      await nextTick()

      expect(wrapper.find('.ui-app-bar__collapsed').exists()).toBe(false)
    })
  })

  describe('sticky', () => {
    it('sticks by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-app-bar--sticky')
    })

    it('scrolls away with sticky off', async () => {
      const wrapper = await mount({ sticky: false })

      expect(wrapper.classes()).not.toContain('ui-app-bar--sticky')
    })

    it('is no layout zone outside a layout', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-app-bar--anchored')
      expect(wrapper.attributes('data-m3-zone')).toBeUndefined()
    })
  })

  describe('safe area', () => {
    it('clears the window cutouts itself when it sticks outside a layout', async () => {
      expect((await mount()).classes()).toContain('ui-app-bar--safe-area')
      expect((await mount({ sticky: false })).classes()).not.toContain('ui-app-bar--safe-area')
    })

    it.each(['direct', 'header', 'main'] as const)('leaves the cutouts to the layout (%s)', async (zone) => {
      const bar = await mountInLayout(() => h(MAppBar, { title: 'Inbox' }), zone)

      expect(bar.classes()).not.toContain('ui-app-bar--safe-area')
    })
  })

  describe('heading level', () => {
    it('keeps the title a paragraph until a level is named', async () => {
      const wrapper = await mount({ title: 'Inbox' })

      expect(wrapper.find('.ui-app-bar__title').element.tagName).toBe('P')
    })

    it.each([1, 2, 3, 4, 5, 6] as const)('renders the title as h%i', async (headingLevel) => {
      const wrapper = await mount({ title: 'Inbox', headingLevel })

      expect(wrapper.find('.ui-app-bar__title').element.tagName).toBe(`H${headingLevel}`)
    })

    it('keeps the subtitle a paragraph under a heading', async () => {
      const wrapper = await mount({ title: 'Inbox', subtitle: 'unread', headingLevel: 1 })

      expect(wrapper.find('.ui-app-bar__subtitle').element.tagName).toBe('P')
    })

    it('a composed title takes the bar level unless it names its own', async () => {
      const inherited = await mount({ headingLevel: 2 }, { default: () => h(MAppBarTitle, { title: 'X' }) })
      expect(inherited.find('.ui-app-bar__title').element.tagName).toBe('H2')

      const own = await mount({ headingLevel: 2 }, { default: () => h(MAppBarTitle, { title: 'X', headingLevel: 3 }) })
      expect(own.find('.ui-app-bar__title').element.tagName).toBe('H3')
    })
  })
})
