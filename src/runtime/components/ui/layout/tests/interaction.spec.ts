import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue'
import type { Component, VNodeChild } from 'vue'
import MLayout from '../index.vue'
import MLayoutHeader from '../header.vue'
import MLayoutAside from '../aside.vue'
import MLayoutMain from '../main.vue'
import MLayoutItem from '../item.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MNavigationRail from '#kit/components/ui/navigation-rail/index.vue'
import type { MNavigationRailItem } from '#kit/components/ui/navigation-rail/props'
import MSnackbar from '#kit/components/ui/snackbar/index.vue'
import { Probe, createZoneCapture, layoutCss, probeItems } from './helpers'

let current: { unmount: () => void } | null = null

async function mount(render: () => VNodeChild, attachTo?: Element) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }), { attachTo })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
  vi.restoreAllMocks()
})

const DocsHeaderWrapper = defineComponent({
  render: () => h(MAppBar, { title: 'Docs header' }),
})

const NestedWrapper: Component = defineComponent({
  props: { depth: { type: Number, required: true } },
  setup(props) {
    return () => props.depth > 0
      ? h(NestedWrapper, { depth: props.depth - 1 })
      : h(MAppBar, { title: 'Nested header' })
  },
})

const MAIN = { kind: 'main', size: null, sticky: false }
const railItems: MNavigationRailItem[] = [{ id: 'home', icon: 'home', label: 'Home' }]

describe('m-layout · interaction', () => {
  describe('registration', () => {
    it('two sized headers register as sticky top zones with zone attributes', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutHeader, { sizeToken: '--h1' }),
        h(MLayoutHeader, { sizeToken: '--h2' }),
        h(MLayoutMain, () => h(Probe)),
      ]))
      const headers = wrapper.findAll('header')

      expect(headers).toHaveLength(2)
      for (const header of headers) {
        expect(header.attributes('data-m3-zone')).toBeTruthy()
        expect(header.attributes('data-m3-zone')).toBe((header.element as HTMLElement).style.gridArea)
      }
      expect(probeItems(wrapper)).toEqual([
        { kind: 'top', size: 'var(--h1)', sticky: true },
        { kind: 'top', size: 'var(--h2)', sticky: true },
        MAIN,
      ])
    })

    it('an app bar self-registers as a top zone at the first level', async () => {
      const wrapper = await mount(() => h(MLayout, () => [h(MAppBar, { title: 'Title' }), h(MLayoutMain, () => h(Probe))]))
      const bar = wrapper.find('.ui-app-bar')

      expect((bar.element as HTMLElement).style.gridArea).toBeTruthy()
      expect(bar.attributes('data-m3-zone')).toBe((bar.element as HTMLElement).style.gridArea)
      expect(bar.classes()).toContain('ui-app-bar--anchored')
      expect(probeItems(wrapper)).toEqual([{ kind: 'top', size: 'var(--ui-app-bar-height-small)', sticky: true }, MAIN])
    })

    it('an app bar registers through a shallow transparent component wrapper', async () => {
      const wrapper = await mount(() => h(MLayout, () => [h(DocsHeaderWrapper), h(MLayoutMain, () => h(Probe))]))
      const bar = wrapper.find('.ui-app-bar')

      expect(bar.attributes('data-m3-zone')).toBeTruthy()
      expect(bar.classes()).toContain('ui-app-bar--anchored')
      expect(probeItems(wrapper)).toEqual([{ kind: 'top', size: 'var(--ui-app-bar-height-small)', sticky: true }, MAIN])
    })

    it('an app bar inside m-layout-header contributes its height to the zone instead', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutHeader, () => h(MAppBar, { title: 'Title' })),
        h(MLayoutMain, () => h(Probe)),
      ]))
      const bar = wrapper.find('.ui-app-bar')

      expect((bar.element as HTMLElement).style.gridArea).toBeFalsy()
      expect(bar.attributes('data-m3-zone')).toBeUndefined()
      expect(bar.classes()).not.toContain('ui-app-bar--anchored')
      expect(wrapper.find('header').attributes('data-m3-zone')).toBeTruthy()
      expect(probeItems(wrapper)).toEqual([{ kind: 'top', size: 'var(--ui-app-bar-height-small)', sticky: true }, MAIN])
    })

    it('does not register through more than three component ancestors', async () => {
      const wrapper = await mount(() => h(MLayout, () => [h(NestedWrapper, { depth: 3 }), h(MLayoutMain, () => h(Probe))]))

      expect(wrapper.find('.ui-app-bar').attributes('data-m3-zone')).toBeUndefined()
      expect(probeItems(wrapper)).toEqual([MAIN])
    })

    it('asides register their side and sticky intent for the css generator', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutAside, { sizeToken: '--w', sticky: true }),
        h(MLayoutAside, { position: 'end', sizeToken: '--w2' }),
        h(MLayoutMain, () => h(Probe)),
      ]))
      const asides = wrapper.findAll('aside')

      expect(asides[0]!.attributes('data-m3-zone')).toBeTruthy()
      expect(asides[1]!.attributes('data-m3-zone')).toBeTruthy()
      expect(probeItems(wrapper)).toEqual([
        { kind: 'start', size: 'var(--w)', sticky: true },
        { kind: 'end', size: 'var(--w2)', sticky: false },
        MAIN,
      ])
    })

    it('a navigation rail contributes its width and drops viewport anchoring inside an aside zone', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutAside, { sticky: true }, () => h(MNavigationRail, { items: railItems })),
        h(MLayoutMain, () => h(Probe)),
      ]))
      const rail = wrapper.find('.ui-navigation-rail')

      expect(rail.classes()).toContain('ui-navigation-rail--hosted')
      expect(rail.attributes('data-m3-zone')).toBeUndefined()
      expect(probeItems(wrapper)).toEqual([{ kind: 'start', size: 'var(--ui-navigation-rail-width)', sticky: true }, MAIN])
    })

    it('a navigation rail fills only a side zone: inside main it keeps its own width', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutAside, { position: 'end' }, () => h(MNavigationRail, { 'items': railItems, 'data-testid': 'aside-rail' })),
        h(MLayoutMain, () => h(MNavigationRail, { 'items': railItems, 'data-testid': 'main-rail' })),
      ]))

      expect(wrapper.find('[data-testid="aside-rail"]').classes()).toContain('ui-navigation-rail--hosted')
      expect(wrapper.find('[data-testid="main-rail"]').classes()).not.toContain('ui-navigation-rail--hosted')
    })

    it('a sizeless sticky top zone stays in flow: inline style carries the grid area only', async () => {
      const wrapper = await mount(() => h(MLayout, () => [h(MLayoutHeader), h(MLayoutMain, () => h(Probe))]))
      const header = wrapper.find('header')
      const el = header.element as HTMLElement

      expect(el.style.position).toBe('')
      expect(el.style.gridArea).toBeTruthy()
      expect(header.attributes('data-m3-zone')).toBe(el.style.gridArea)
      expect(await layoutCss(wrapper)).not.toContain('position: fixed')
    })

    it('an m-layout-item without a kind is no zone: no grid area, and no second main', async () => {
      // Vue reports the missing required prop; the kit's own dev warning sits behind import.meta.dev (false here).
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutItem as Component, { 'data-testid': 'item' }),
        h(MLayoutMain, () => h(Probe)),
      ]))
      const item = wrapper.find('[data-testid="item"]')

      expect(item.attributes('data-m3-zone')).toBeUndefined()
      expect((item.element as HTMLElement).style.gridArea).toBe('')
      expect(probeItems(wrapper).map(entry => entry.kind)).toEqual(['main'])
    })

    it('an m-layout-item with a kind registers as that zone', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutItem, { 'kind': 'bottom', 'sizeToken': '56rem', 'data-testid': 'item' }),
        h(MLayoutMain, () => h(Probe)),
      ]))

      expect(wrapper.find('[data-testid="item"]').attributes('data-m3-zone')).toMatch(/^bottom-/)
      expect(probeItems(wrapper).map(entry => entry.kind)).toEqual(['bottom', 'main'])
    })
  })

  describe('first level', () => {
    beforeEach(() => {
      const host = document.createElement('div')
      host.id = 'ui-overlay-host'
      document.body.appendChild(host)
    })

    afterEach(() => {
      document.getElementById('ui-overlay-host')?.remove()
    })

    it('a snackbar at the first level adds no element to the grid', async () => {
      // Recorded in mounted: a placeholder swapped out right after mount is still caught.
      const strays: string[] = []
      const StrayProbe = defineComponent({
        setup() {
          const el = shallowRef<HTMLElement | null>(null)

          onMounted(() => {
            for (const child of Array.from(el.value?.closest('.m-layout')?.children ?? [])) {
              if (child instanceof HTMLElement && !child.style.gridArea) strays.push(child.tagName.toLowerCase())
            }
          })

          return () => h('div', { ref: el })
        },
      })

      await mount(() => h(MLayout, () => [h(MLayoutMain, () => h(StrayProbe)), h(MSnackbar, { label: 'Saved' })]))

      expect(strays).toEqual([])
    })
  })

  describe('updates', () => {
    it('an unmounted zone leaves the registry and the grid', async () => {
      const shown = ref(true)
      const wrapper = await mount(() => h(MLayout, () => [
        shown.value ? h(MLayoutItem, { id: 'nav', kind: 'start', sizeToken: '80rem' }) : null,
        h(MLayoutMain, () => h(Probe)),
      ]))
      expect(probeItems(wrapper).map(entry => entry.kind)).toEqual(['start', 'main'])

      shown.value = false
      await nextTick()
      await nextTick()

      expect(probeItems(wrapper).map(entry => entry.kind)).toEqual(['main'])
      expect(await layoutCss(wrapper)).not.toContain('nav')
    })

    it('a zone mounted after hydration takes its DOM position, not the end of the registry', async () => {
      const shown = ref(false)
      const wrapper = await mount(() => h(MLayout, () => [
        shown.value ? h(MLayoutHeader, { sizeToken: '64rem' }) : null,
        h(MLayoutMain, () => h(Probe)),
      ]), document.body)

      shown.value = true
      await nextTick()
      await nextTick()

      expect(probeItems(wrapper).map(entry => entry.kind)).toEqual(['top', 'main'])
    })

    it('re-carves when a zone stops being sticky', async () => {
      const sticky = ref(true)
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutItem, { id: 'bar', kind: 'top', sizeToken: '64rem', sticky: sticky.value }),
        h(MLayoutItem, { id: 'content', kind: 'main' }),
      ]))
      expect(await layoutCss(wrapper)).toContain('position: fixed')

      sticky.value = false
      await nextTick()

      expect(await layoutCss(wrapper)).not.toContain('position: fixed')
    })
  })

  describe('context zone', () => {
    it('gives any descendant the cumulative edges as logical CSS expressions', async () => {
      const { Capture, captured } = createZoneCapture()
      const wrapper = await mount(() => h(MLayout, () => h(MLayoutMain, () => h(Capture))))

      expect(captured.zone?.layoutId).toBe(wrapper.find('.m-layout').attributes('id'))
      expect(captured.zone?.insets).toEqual({
        top: 'var(--m3-layout-inset-top, 0px)',
        bottom: 'var(--m3-layout-inset-bottom, 0px)',
        start: 'var(--m3-layout-inset-inline-start, 0px)',
        end: 'var(--m3-layout-inset-inline-end, 0px)',
      })
      expect(captured.zone?.sticky.top).toBe('var(--m3-layout-inset-top, 0px)')
      expect(captured.zone?.windowY.value).toBe(0)
    })

    it('degrades to null outside a layout', async () => {
      const { Capture, captured } = createZoneCapture()
      await mount(() => h(Capture))

      expect(captured.zone).toBeNull()
    })

    it('windowY follows the document in page-scroll mode', async () => {
      const { Capture, captured } = createZoneCapture()
      await mount(() => h(MLayout, () => h(MLayoutMain, () => h(Capture))), document.body)
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(120)

      window.dispatchEvent(new Event('scroll'))

      expect(captured.zone?.windowY.value).toBe(120)
    })

    it('windowY starts from a page already scrolled before any scroll event', async () => {
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(300)
      const { Capture, captured } = createZoneCapture()
      await mount(() => h(MLayout, () => h(MLayoutMain, () => h(Capture))), document.body)

      expect(captured.zone?.windowY.value).toBe(300)
    })

    it('windowY follows main when main is the scroller', async () => {
      const { Capture, captured } = createZoneCapture()
      const wrapper = await mount(() => h(MLayout, { fullHeight: true }, () => h(MLayoutMain, () => h(Capture))), document.body)
      const main = wrapper.find('main').element as HTMLElement

      main.scrollTop = 40
      main.dispatchEvent(new Event('scroll'))

      expect(captured.zone?.windowY.value).toBe(40)
    })

    it('scrollLock is ref-counted: two holders, one physical lock', async () => {
      const { Capture, captured } = createZoneCapture()
      await mount(() => h(MLayout, () => h(MLayoutMain, () => h(Capture))), document.body)
      const root = document.documentElement

      captured.zone!.scrollLock(true)
      captured.zone!.scrollLock(true)
      expect(root.style.overflow).toBe('hidden')

      captured.zone!.scrollLock(false)
      expect(root.style.overflow).toBe('hidden')

      captured.zone!.scrollLock(false)
      expect(root.style.overflow).toBe('')
    })

    it.each([
      [false, ''],
      [true, 'hidden'],
    ])('scrollLock freezes main only when it scrolls (full-height %s)', async (fullHeight, overflow) => {
      const { Capture, captured } = createZoneCapture()
      const wrapper = await mount(() => h(MLayout, { fullHeight }, () => h(MLayoutMain, () => h(Capture))), document.body)
      const main = wrapper.find('main').element as HTMLElement

      captured.zone!.scrollLock(true)
      expect(main.style.overflow).toBe(overflow)

      captured.zone!.scrollLock(false)
      expect(main.style.overflow).toBe('')
    })
  })
})
