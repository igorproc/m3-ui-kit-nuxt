import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import type { Component, VNodeChild } from 'vue'
import MLayout from '../index.vue'
import MLayoutHeader from '../header.vue'
import MLayoutFooter from '../footer.vue'
import MLayoutAside from '../aside.vue'
import MLayoutMain from '../main.vue'
import MLayoutItem from '../item.vue'
import { layoutCss, rangeBlock } from './helpers'

let current: { unmount: () => void } | null = null

async function mount(render: () => VNodeChild) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }))

  return current as VueWrapper
}

const inLayout = (layoutProps: Record<string, unknown>, zones: () => VNodeChild) =>
  mount(() => h(MLayout, layoutProps, zones))

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-layout · variants', () => {
  describe('root', () => {
    it('is a grid root whose id the generated style targets', async () => {
      const wrapper = await inLayout({}, () => h(MLayoutMain))
      const root = wrapper.find('.m-layout')

      expect(root.attributes('id')).toMatch(/^m-layout-/)
      expect(await layoutCss(wrapper)).toContain(`#${root.attributes('id')} {`)
    })

    it.each([
      [false, false],
      [true, true],
    ])('full-height %s → m-layout--full-height %s', async (fullHeight, expected) => {
      const wrapper = await inLayout({ fullHeight }, () => h(MLayoutMain))

      expect(wrapper.find('.m-layout').classes().includes('m-layout--full-height')).toBe(expected)
    })

    it('marks a layout nested in another one, and only that one', async () => {
      const wrapper = await mount(() => h(MLayout, { 'data-testid': 'outer' }, () => h(MLayoutMain, () =>
        h(MLayout, { 'data-testid': 'inner' }, () => h(MLayoutItem, { kind: 'main' })),
      )))

      expect(wrapper.find('[data-testid="outer"]').classes()).not.toContain('m-layout--nested')
      expect(wrapper.find('[data-testid="inner"]').classes()).toContain('m-layout--nested')
    })
  })

  describe('zones', () => {
    it.each([
      [true, true],
      [false, false],
    ])('m-layout-header sticky=%s → --sticky %s', async (sticky, expected) => {
      const wrapper = await inLayout({}, () => [h(MLayoutHeader, { sticky }), h(MLayoutMain)])

      expect(wrapper.find('header').classes().includes('m-layout-header--sticky')).toBe(expected)
    })

    it('a header is sticky by default, a footer is not', async () => {
      const wrapper = await inLayout({}, () => [h(MLayoutHeader), h(MLayoutFooter), h(MLayoutMain)])

      expect(wrapper.find('header').classes()).toContain('m-layout-header--sticky')
      expect(wrapper.find('footer').classes()).not.toContain('m-layout-footer--sticky')
    })

    it('a sticky footer gets its modifier', async () => {
      const wrapper = await inLayout({}, () => [h(MLayoutFooter, { sticky: true }), h(MLayoutMain)])

      expect(wrapper.find('footer').classes()).toContain('m-layout-footer--sticky')
    })

    it.each(['start', 'end'] as const)('m-layout-aside position=%s takes that logical side', async (position) => {
      const wrapper = await inLayout({}, () => [h(MLayoutAside, { position }), h(MLayoutMain)])
      const aside = wrapper.find('aside')

      expect(aside.classes()).toContain(`m-layout-aside--${position}`)
      expect(aside.attributes('data-m3-zone')).toMatch(new RegExp(`^${position}-`))
    })

    it('an aside defaults to the start side and to the flow', async () => {
      const wrapper = await inLayout({}, () => [h(MLayoutAside), h(MLayoutMain)])
      const aside = wrapper.find('aside')

      expect(aside.classes()).toContain('m-layout-aside--start')
      expect(aside.classes()).not.toContain('m-layout-aside--sticky')
    })

    it('a sticky aside gets its modifier', async () => {
      const wrapper = await inLayout({}, () => [h(MLayoutAside, { sticky: true }), h(MLayoutMain)])

      expect(wrapper.find('aside').classes()).toContain('m-layout-aside--sticky')
    })

    it.each(['top', 'bottom', 'start', 'end', 'main'] as const)('m-layout-item kind=%s registers as that zone', async (kind) => {
      const wrapper = await inLayout({}, () => h(MLayoutItem, { 'kind': kind, 'data-testid': 'item' }))
      const item = wrapper.find('[data-testid="item"]')

      expect(item.attributes('data-m3-zone')).toMatch(new RegExp(`^${kind}-`))
      expect(item.classes().includes('m-layout-item--main')).toBe(kind === 'main')
    })

    it.each([
      ['nav', 'nav'],
      ['side panel!', 'sidepanel'],
      ['1st', 'z1st'],
    ])('an explicit item id %j becomes the grid area %j', async (id, area) => {
      const wrapper = await inLayout({}, () => h(MLayoutItem, { 'id': id, 'kind': 'start', 'data-testid': 'item' }))
      const item = wrapper.find('[data-testid="item"]')

      expect(item.attributes('data-m3-zone')).toBe(area)
      expect((item.element as HTMLElement).style.gridArea).toBe(area)
    })

    it('m-layout-main is a size container only on request', async () => {
      const plain = await inLayout({}, () => h(MLayoutMain))
      expect(plain.find('main').classes()).not.toContain('m-layout-main--container')

      const container = await inLayout({}, () => h(MLayoutMain, { container: true }))
      expect(container.find('main').classes()).toContain('m-layout-main--container')
    })

    it.each([
      ['m-layout-header', MLayoutHeader, 'header'],
      ['m-layout-footer', MLayoutFooter, 'footer'],
      ['m-layout-aside', MLayoutAside, 'aside'],
      ['m-layout-main', MLayoutMain, 'main'],
    ] as [string, Component, string][])('%s renders its default slot', async (_name, zone, tag) => {
      const wrapper = await inLayout({}, () => h(zone, () => h('p', { 'data-testid': 'content' }, 'Content')))

      expect(wrapper.find(`${tag} [data-testid="content"]`).text()).toBe('Content')
    })

    it.each([
      ['m-layout-header', MLayoutHeader, 'header'],
      ['m-layout-footer', MLayoutFooter, 'footer'],
      ['m-layout-aside', MLayoutAside, 'aside'],
      ['m-layout-main', MLayoutMain, 'main'],
    ] as [string, Component, string][])('%s outside a layout is no zone', async (_name, zone, tag) => {
      const wrapper = await mount(() => h(zone))
      const el = wrapper.find(tag)

      expect(el.attributes('data-m3-zone')).toBeUndefined()
      expect((el.element as HTMLElement).style.gridArea).toBe('')
    })
  })

  describe('generated grid', () => {
    const shell = (props: { order?: number } = {}) => () => [
      h(MLayoutItem, { id: 'bar', kind: 'top', sizeToken: '64rem' }),
      h(MLayoutItem, { id: 'nav', kind: 'start', sizeToken: '80rem', ...props }),
      h(MLayoutItem, { id: 'side', kind: 'end', sizeToken: '320rem' }),
      h(MLayoutItem, { id: 'content', kind: 'main' }),
    ]

    it('carves the bands in DOM order: whoever comes first owns the corner', async () => {
      const css = rangeBlock(await layoutCss(await inLayout({}, shell())), 'desktop')

      expect(css).toContain('grid-template-areas: "bar bar bar" "nav content side";')
      expect(css).toContain('grid-template-columns: calc(var(--m3-layout-nav-size, 0px) + var(--m3-layout-safe-inline-start, 0px)) minmax(0, 1fr) calc(var(--m3-layout-side-size, 0px) + var(--m3-layout-safe-inline-end, 0px));')
    })

    it('an explicit order carves a zone before the ones above it in the DOM', async () => {
      const css = rangeBlock(await layoutCss(await inLayout({}, shell({ order: -1 }))), 'desktop')

      expect(css).toContain('grid-template-areas: "nav bar bar" "nav content side";')
    })

    it.each([
      ['mobile', '"bar" "content"'],
      ['tablet', '"bar bar" "nav content"'],
      ['desktop', '"bar bar bar" "nav content side"'],
    ] as const)('the %s range keeps only its zones: %s', async (range, areas) => {
      const css = rangeBlock(await layoutCss(await inLayout({}, shell())), range)

      expect(css).toContain(`grid-template-areas: ${areas};`)
    })

    it('hides a zone outside its range instead of letting it become an implicit track', async () => {
      const wrapper = await inLayout({}, shell())
      const css = await layoutCss(wrapper)
      const id = wrapper.find('.m-layout').attributes('id')

      expect(rangeBlock(css, 'mobile')).toContain(`#${id} > [data-m3-zone="nav"] {\n  display: none;\n}`)
      expect(rangeBlock(css, 'tablet')).toContain(`#${id} > [data-m3-zone="side"] {\n  display: none;\n}`)
      expect(rangeBlock(css, 'desktop')).not.toContain('display: none')
    })

    it.each([
      ['top', 'position: fixed;'],
      ['bottom', 'position: fixed;'],
      ['start', 'position: sticky;'],
      ['end', 'position: sticky;'],
    ] as const)('a sized sticky %s zone is pinned with %s', async (kind, position) => {
      const css = await layoutCss(await inLayout({}, () => [
        h(MLayoutItem, { id: 'zone', kind, sizeToken: '64rem', sticky: true }),
        h(MLayoutItem, { id: 'content', kind: 'main' }),
      ]))

      expect(rangeBlock(css, 'desktop')).toContain(position)
    })

    it.each(['top', 'bottom', 'start', 'end'] as const)('a %s zone in flow is not positioned', async (kind) => {
      const css = await layoutCss(await inLayout({}, () => [
        h(MLayoutItem, { id: 'zone', kind, sizeToken: '64rem' }),
        h(MLayoutItem, { id: 'content', kind: 'main' }),
      ]))

      expect(css).not.toContain('position:')
    })

    it('a nested layout keeps its sticky zones in flow: the outer one owns the window', async () => {
      const wrapper = await mount(() => h(MLayout, () => h(MLayoutMain, () => h(MLayout, { 'data-testid': 'inner' }, () => [
        h(MLayoutHeader, { sizeToken: '64rem' }),
        h(MLayoutItem, { kind: 'main' }),
      ]))))
      const css = await layoutCss(wrapper, '[data-testid="inner"]')

      expect(css).toContain('grid-template-areas')
      expect(css).not.toContain('position: fixed')
      expect(css).not.toContain('html {')
    })

    it('the outer layout publishes its window insets on html for teleported surfaces', async () => {
      const css = rangeBlock(await layoutCss(await inLayout({}, () => [
        h(MLayoutItem, { id: 'content', kind: 'main' }),
        h(MLayoutItem, { id: 'dock', kind: 'bottom', sizeToken: '80rem', sticky: true }),
      ])), 'desktop')
      const root = css.slice(css.indexOf('html {')).split('}')[0]

      expect(root).toContain('--m3-layout-dock-size: 80rem;')
      expect(root).toContain('--m3-layout-inset-bottom: calc(var(--m3-layout-dock-size, 0px) + env(safe-area-inset-bottom, 0px));')
    })
  })
})
