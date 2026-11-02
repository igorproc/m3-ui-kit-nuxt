import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Component } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutHeader from '#kit/components/ui/layout/header.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MAppBar from '../index.vue'
import MAppBarNav from '../nav/index.vue'
import MAppBarTitle from '../title/index.vue'
import MAppBarActions from '../actions/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAppBar, { props, slots, attachTo: document.body })

  return current as VueWrapper
}

async function mountHost(render: () => ReturnType<typeof h>) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }), { attachTo: document.body })

  return current as VueWrapper
}

async function scrollWindowTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
}

afterEach(async () => {
  current?.unmount()
  current = null
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  vi.restoreAllMocks()
})

describe('m-app-bar · interaction', () => {
  describe('scroll fill', () => {
    it('fills the container once the window scrolls and clears it back at the top', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-app-bar--scrolled')

      await scrollWindowTo(120)
      expect(wrapper.classes()).toContain('ui-app-bar--scrolled')

      await scrollWindowTo(0)
      expect(wrapper.classes()).not.toContain('ui-app-bar--scrolled')
    })

    it.each([true, false])('pins the state with a controlled scrolled=%s', async (scrolled) => {
      const wrapper = await mount({ scrolled })

      expect(wrapper.classes().includes('ui-app-bar--scrolled')).toBe(scrolled)
    })

    it('ignores the window while controlled', async () => {
      const wrapper = await mount({ scrolled: false })

      await scrollWindowTo(120)

      expect(wrapper.classes()).not.toContain('ui-app-bar--scrolled')
    })

    it('follows the offset of its layout inside m-layout', async () => {
      const wrapper = await mountHost(() => h(MLayout, () => [
        h(MAppBar, { title: 'Inbox' }),
        h(MLayoutMain, () => 'Content'),
      ]))
      const bar = wrapper.find('.ui-app-bar')

      await scrollWindowTo(80)

      expect(bar.classes()).toContain('ui-app-bar--scrolled')
    })

    it('follows main, the scroller of a full-height layout', async () => {
      const wrapper = await mountHost(() => h(MLayout, { fullHeight: true }, () => [
        h(MAppBar, { title: 'Inbox' }),
        h(MLayoutMain, () => 'Content'),
      ]))
      await nextTick()
      const main = wrapper.find('.m-layout-main').element as HTMLElement

      main.scrollTop = 64
      main.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.ui-app-bar').classes()).toContain('ui-app-bar--scrolled')
    })
  })

  // The bar used to start unfilled on a page loaded already scrolled.
  describe('initial scroll', () => {
    it('fills at once on a page that is already scrolled when it mounts', async () => {
      Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })

      const wrapper = await mount()
      await nextTick()

      expect(wrapper.classes()).toContain('ui-app-bar--scrolled')
    })
  })

  // W65-В fallback: without scroll-driven animations the bar folds at once.
  describe('collapse fallback', () => {
    const stubTimelines = (supported: boolean) => vi.stubGlobal('CSS', {
      supports: (declaration: string) => !declaration.startsWith('animation-timeline') || supported,
    })

    beforeEach(() => stubTimelines(false))
    afterEach(() => vi.unstubAllGlobals())

    it('leaves the fold to CSS where scroll-driven animations exist', async () => {
      stubTimelines(true)
      const wrapper = await mount({ type: 'medium', title: 'Inbox', scrollBehavior: 'collapse' })

      await scrollWindowTo(400)

      expect(wrapper.classes()).toContain('ui-app-bar--collapse')
      expect(wrapper.classes()).not.toContain('ui-app-bar--collapsed')
    })

    it('folds a collapsing bar once its scroller moves and unfolds it at the top', async () => {
      const wrapper = await mount({ type: 'medium', title: 'Inbox', scrollBehavior: 'collapse' })

      await scrollWindowTo(40)
      expect(wrapper.classes()).toContain('ui-app-bar--collapsed')

      await scrollWindowTo(0)
      expect(wrapper.classes()).not.toContain('ui-app-bar--collapsed')
    })

    it('never folds a pinned bar', async () => {
      const wrapper = await mount({ type: 'medium', title: 'Inbox' })

      await scrollWindowTo(400)

      expect(wrapper.classes()).not.toContain('ui-app-bar--collapsed')
    })

    it('folds a bar already scrolled past when it mounts', async () => {
      Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })

      const wrapper = await mount({ type: 'large', title: 'Inbox', scrollBehavior: 'collapse' })
      await nextTick()

      expect(wrapper.classes()).toContain('ui-app-bar--collapsed')
    })

    it('follows main when it is page content of a full-height main', async () => {
      const wrapper = await mountHost(() => h(MLayout, { fullHeight: true }, () => [
        h(MLayoutMain, () => h(MAppBar, { type: 'medium', title: 'Pane', scrollBehavior: 'collapse' })),
      ]))
      await nextTick()
      const main = wrapper.find('.m-layout-main').element as HTMLElement

      main.scrollTop = 64
      main.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.ui-app-bar').classes()).toContain('ui-app-bar--collapsed')
    })

    // The layout holds the zone at its row height, so only the CSS fold can shrink it.
    it('stays open as a pinned zone of its own in a page-scroll layout', async () => {
      const wrapper = await mountHost(() => h(MLayout, () => [
        h(MAppBar, { type: 'medium', title: 'Inbox', scrollBehavior: 'collapse' }),
        h(MLayoutMain, () => 'Content'),
      ]))

      await scrollWindowTo(200)

      expect(wrapper.find('.ui-app-bar').classes()).not.toContain('ui-app-bar--collapsed')
    })

    // Its row is carved at the expanded height: folding would open a gap above main.
    it('stays open as a zone of a full-height layout, whose window does not scroll', async () => {
      const wrapper = await mountHost(() => h(MLayout, { fullHeight: true }, () => [
        h(MAppBar, { type: 'medium', title: 'Inbox', scrollBehavior: 'collapse' }),
        h(MLayoutMain, () => 'Content'),
      ]))
      await nextTick()
      const main = wrapper.find('.m-layout-main').element as HTMLElement

      main.scrollTop = 64
      main.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.ui-app-bar').classes()).not.toContain('ui-app-bar--collapsed')
    })
  })

  describe('layout', () => {
    it('registers as an anchored top zone when it is a direct child of m-layout', async () => {
      const wrapper = await mountHost(() => h(MLayout, () => [
        h(MAppBar, { title: 'Inbox' }),
        h(MLayoutMain, () => 'Content'),
      ]))
      const bar = wrapper.find('.ui-app-bar')

      expect(bar.classes()).toContain('ui-app-bar--anchored')
      expect(bar.attributes('data-m3-zone')).toBeTruthy()
      expect(bar.attributes('style')).toContain('grid-area')
    })

    it('inside m-layout-header it lends its height to the zone and anchors nothing itself', async () => {
      const wrapper = await mountHost(() => h(MLayout, () => [
        h(MLayoutHeader, () => h(MAppBar, { title: 'Inbox' })),
        h(MLayoutMain, () => 'Content'),
      ]))
      const bar = wrapper.find('.ui-app-bar')

      expect(bar.classes()).not.toContain('ui-app-bar--anchored')
      expect(bar.attributes('data-m3-zone')).toBeUndefined()
      expect(wrapper.find('.m-layout-header').attributes('data-m3-zone')).toBeTruthy()
    })

    it('inside m-layout-main it is page content: no zone', async () => {
      const wrapper = await mountHost(() => h(MLayout, () => [
        h(MLayoutMain, () => h(MAppBar, { title: 'Pane' })),
      ]))
      const bar = wrapper.find('.ui-app-bar')

      expect(bar.classes()).not.toContain('ui-app-bar--anchored')
      expect(bar.attributes('data-m3-zone')).toBeUndefined()
    })
  })

  describe('composed subtitle', () => {
    it('drops the subtitle height variant when the composed subtitle goes away', async () => {
      const subtitle = ref<string>('unread')
      const wrapper = await mountHost(() => h(MAppBar, null, {
        default: () => h(MAppBarTitle, { title: 'Inbox', subtitle: subtitle.value }),
      }))

      expect(wrapper.find('.ui-app-bar').classes()).toContain('ui-app-bar--subtitle')

      subtitle.value = ''
      await nextTick()

      expect(wrapper.find('.ui-app-bar').classes()).not.toContain('ui-app-bar--subtitle')
    })

    it('forgets the report of an unmounted composed title', async () => {
      const shown = ref(true)
      const wrapper = await mountHost(() => h(MAppBar, null, {
        default: () => shown.value ? h(MAppBarTitle, { title: 'Inbox', subtitle: 'unread' }) : null,
      }))

      shown.value = false
      await nextTick()

      expect(wrapper.find('.ui-app-bar').classes()).not.toContain('ui-app-bar--subtitle')
    })
  })

  describe('compound parts', () => {
    it.each([
      ['MAppBarNav', MAppBarNav],
      ['MAppBarTitle', MAppBarTitle],
      ['MAppBarActions', MAppBarActions],
    ] as [string, Component][])('%s refuses to render outside an MAppBar', async (_name, part) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      await expect(mountSuspended(part)).rejects.toThrow('m3:app-bar')
    })
  })
})
