import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import type { Component, VNodeChild } from 'vue'
import { renderToString } from 'vue/server-renderer'
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

const ssr = (render: () => VNodeChild) => renderToString(createSSRApp(defineComponent({ render })))

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-layout · a11y', () => {
  describe('landmarks', () => {
    // The deprecated <m-main> drew a second, zone-less <main>; it is removed without an alias.
    it('leaves m-layout-main the only public main landmark', () => {
      const publicMains = Object.keys(import.meta.glob('../../main/*.vue'))

      expect(publicMains).toEqual([])
    })

    it.each([
      ['m-layout-header', MLayoutHeader, 'HEADER'],
      ['m-layout-footer', MLayoutFooter, 'FOOTER'],
      ['m-layout-aside', MLayoutAside, 'ASIDE'],
      ['m-layout-main', MLayoutMain, 'MAIN'],
    ] as [string, Component, string][])('%s is the native <%s> landmark, with no invented role', async (_name, zone, tag) => {
      const wrapper = await mount(() => h(MLayout, () => h(zone, { 'data-testid': 'zone' })))
      const el = wrapper.find('[data-testid="zone"]')

      expect(el.element.tagName).toBe(tag)
      expect(el.attributes('role')).toBeUndefined()
    })

    it('the layout root and a generic item add no landmark of their own', async () => {
      const wrapper = await mount(() => h(MLayout, () => h(MLayoutItem, { 'kind': 'start', 'data-testid': 'item' })))

      expect(wrapper.find('.m-layout').element.tagName).toBe('DIV')
      expect(wrapper.find('.m-layout').attributes('role')).toBeUndefined()
      expect(wrapper.find('[data-testid="item"]').element.tagName).toBe('DIV')
      expect(wrapper.find('[data-testid="item"]').attributes('role')).toBeUndefined()
    })

    it('passes a name through to a landmark that shares its role with another', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutAside, { 'aria-label': 'Filters' }),
        h(MLayoutAside, { 'position': 'end', 'aria-label': 'Details' }),
        h(MLayoutMain),
      ]))

      expect(wrapper.findAll('aside').map(aside => aside.attributes('aria-label'))).toEqual(['Filters', 'Details'])
    })
  })

  describe('keyboard scrolling', () => {
    it('main in page-scroll mode is no scroller and no tab stop', async () => {
      const main = (await mount(() => h(MLayout, () => h(MLayoutMain)))).find('main')

      expect(main.classes()).not.toContain('m-layout-main--scroll')
      expect(main.attributes('tabindex')).toBeUndefined()
    })

    it('main in full-height mode scrolls itself and is a tab stop for keyboard scrolling', async () => {
      const main = (await mount(() => h(MLayout, { fullHeight: true }, () => h(MLayoutMain)))).find('main')

      expect(main.classes()).toContain('m-layout-main--scroll')
      expect(main.attributes('tabindex')).toBe('0')
    })

    it('an item of kind main gets the main minima, and the scroller role only in full-height mode', async () => {
      const page = (await mount(() => h(MLayout, () => h(MLayoutItem, { 'kind': 'main', 'data-testid': 'item' }))))
        .find('[data-testid="item"]')

      expect(page.classes()).toContain('m-layout-item--main')
      expect(page.classes()).not.toContain('m-layout-item--scroll')
      expect(page.attributes('tabindex')).toBeUndefined()

      const shell = (await mount(() => h(MLayout, { fullHeight: true }, () => h(MLayoutItem, { 'kind': 'main', 'data-testid': 'item' }))))
        .find('[data-testid="item"]')

      expect(shell.classes()).toContain('m-layout-item--scroll')
      expect(shell.attributes('tabindex')).toBe('0')
    })

    it('an edge zone is never the scroller, even in full-height mode', async () => {
      const wrapper = await mount(() => h(MLayout, { fullHeight: true }, () => h(MLayoutItem, { 'kind': 'bottom', 'data-testid': 'item' })))
      const item = wrapper.find('[data-testid="item"]')

      expect(item.classes()).not.toContain('m-layout-item--main')
      expect(item.classes()).not.toContain('m-layout-item--scroll')
      expect(item.attributes('tabindex')).toBeUndefined()
    })

    // The tab stop must come from the server: a client-only attribute would change after hydration.
    it('the server already renders the tab stop of a scrolling main', async () => {
      const html = await ssr(() => h(MLayout, { fullHeight: true }, () => h(MLayoutMain, () => 'Content')))

      expect(html).toMatch(/<main[^>]*class="m-layout-main m-layout-main--scroll"[^>]*tabindex="0"/)
    })

    it('the server renders no tab stop when the document scrolls', async () => {
      const html = await ssr(() => h(MLayout, () => h(MLayoutMain, () => 'Content')))

      expect(html).toMatch(/<main[^>]*>/)
      expect(html).not.toContain('tabindex')
    })

    it('the server renders every zone in its grid area: the first paint needs no script', async () => {
      const html = await ssr(() => h(MLayout, () => [h(MLayoutHeader, { sizeToken: '64rem' }), h(MLayoutMain)]))

      expect(html).toMatch(/<header[^>]*data-m3-zone="(top-[^"]+)"[^>]*style="grid-area:\1;"/)
      expect(html).toMatch(/<main[^>]*data-m3-zone="(main-[^"]+)"[^>]*style="grid-area:\1;"/)
    })
  })

  describe('focus not obscured', () => {
    it('scroll padding keeps a focused control clear of a pinned top band', async () => {
      const css = rangeBlock(await layoutCss(await mount(() => h(MLayout, () => [
        h(MLayoutItem, { id: 'bar', kind: 'top', sizeToken: '64rem', sticky: true }),
        h(MLayoutItem, { id: 'content', kind: 'main' }),
      ]))), 'desktop')

      expect(css).toContain('scroll-padding-top: calc(var(--m3-layout-bar-size, 0px) + env(safe-area-inset-top, 0px));')
    })

    it('scroll padding keeps a focused control clear of a pinned bottom band', async () => {
      const css = rangeBlock(await layoutCss(await mount(() => h(MLayout, () => [
        h(MLayoutItem, { id: 'content', kind: 'main' }),
        h(MLayoutItem, { id: 'dock', kind: 'bottom', sizeToken: '80rem', sticky: true }),
      ]))), 'desktop')

      expect(css).toContain('scroll-padding-bottom: calc(var(--m3-layout-dock-size, 0px) + env(safe-area-inset-bottom, 0px));')
    })

    it('a scrolling main needs no document scroll padding', async () => {
      const css = await layoutCss(await mount(() => h(MLayout, { fullHeight: true }, () => [
        h(MLayoutItem, { id: 'bar', kind: 'top', sizeToken: '64rem', sticky: true }),
        h(MLayoutItem, { id: 'content', kind: 'main' }),
      ])))

      expect(css).not.toContain('scroll-padding')
    })
  })

  // The stray-element warning and the sizeless-sticky warning sit behind
  // `import.meta.dev`, which Vitest resolves to `false`: not assertable here.
})
