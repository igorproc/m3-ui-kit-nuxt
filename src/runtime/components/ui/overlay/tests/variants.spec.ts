import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MOverlay from '../index.vue'
import { mountTracked, overlayHost, settle, useOverlayHost } from './helpers'

useOverlayHost()

async function mount(props: Record<string, unknown> = {}, slots: Record<string, (...args: never[]) => VNode | VNode[] | string> = {}) {
  const model = ref(Boolean(props.modelValue ?? true))
  const Harness = defineComponent({
    setup: () => () => h(MOverlay, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
    }, { default: () => h('div', { class: 'panel-content' }, 'Panel'), ...slots }),
  })
  const wrapper = await mountTracked(Harness)
  await settle()
  return { model, wrapper }
}

const root = () => document.querySelector<HTMLElement>('.ui-overlay')
const scrim = () => document.querySelector<HTMLElement>('.ui-overlay__scrim')

describe('m-overlay · variants', () => {
  describe('mode', () => {
    it.each([
      ['modal', 'DIALOG', true],
      ['popover', 'DIV', false],
    ] as const)('renders %s mode as a <%s> root with its own modifiers', async (mode, tag, hasScrim) => {
      await mount({ mode })

      expect(root()!.tagName).toBe(tag)
      expect(root()!.classList).toContain(`ui-overlay--${mode}`)
      expect(document.querySelector('.ui-overlay__panel')!.classList).toContain(`ui-overlay__panel--${mode}`)
      expect(Boolean(scrim())).toBe(hasScrim)
    })

    it('defaults to a modal with a scrim', async () => {
      await mount()

      expect(root()!.classList).toContain('ui-overlay--modal')
      expect(scrim()).not.toBeNull()
    })
  })

  describe('scrim', () => {
    it('drops the scrim of a modal with hide-overlay', async () => {
      await mount({ hideOverlay: true })

      expect(scrim()).toBeNull()
    })

    it('adds a scrim to a popover with hide-overlay off', async () => {
      await mount({ mode: 'popover', hideOverlay: false })

      expect(scrim()).not.toBeNull()
    })

    it('renders the scrim slot inside the scrim', async () => {
      await mount({}, { scrim: () => h('span', { class: 'custom-scrim' }) })

      expect(scrim()!.querySelector('.custom-scrim')).not.toBeNull()
    })

    it.each([
      ['auto', true],
      ['persist', false],
    ] as const)('with overlay-behavior %s mutes the covered scrim: %s', async (overlayBehavior, muted) => {
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, { modelValue: true, overlayBehavior }, {
          default: () => h(MOverlay, { modelValue: true, overlayBehavior }, { default: () => h('div', 'Child') }),
        }),
      })
      await mountTracked(Harness)
      await settle()

      const [parentScrim] = document.querySelectorAll('.ui-overlay__scrim')
      expect(parentScrim!.classList.contains('ui-overlay__scrim--muted')).toBe(muted)
    })
  })

  describe('classes', () => {
    it('puts overlay-class on the scrim and content-class on the panel', async () => {
      await mount({ overlayClass: 'my-scrim', contentClass: ['my-panel'] })

      expect(scrim()!.classList).toContain('my-scrim')
      expect(document.querySelector('.ui-overlay__panel')!.classList).toContain('my-panel')
    })

    it('forwards attrs onto the overlay root', async () => {
      await mount({ 'class': 'extra', 'data-test': 'root' })

      expect(root()!.classList).toContain('extra')
      expect(root()!.getAttribute('data-test')).toBe('root')
    })
  })

  describe('display directive', () => {
    it.each([
      ['if', false],
      ['show', true],
    ] as const)('with display-directive %s keeps the root after closing: %s', async (displayDirective, kept) => {
      const { model } = await mount({ displayDirective })

      model.value = false
      await settle()

      expect(Boolean(root())).toBe(kept)
    })
  })

  describe('swipe banner', () => {
    it('renders the swipe-banner slot when a swipe can close the surface', async () => {
      await mount({ showSwipeBanner: true, closeOnSwipe: 'down' }, { 'swipe-banner': () => h('span', { class: 'grip' }) })

      expect(document.querySelector('.ui-overlay__swipe-banner .grip')).not.toBeNull()
    })

    it('renders no swipe banner when swiping is off', async () => {
      await mount({ showSwipeBanner: true, closeOnSwipe: 'none' }, { 'swipe-banner': () => h('span', { class: 'grip' }) })

      expect(document.querySelector('.ui-overlay__swipe-banner')).toBeNull()
    })
  })

  describe('swipe axis', () => {
    it.each([
      ['down', 'ui-overlay__panel--swipe-block'],
      ['up', 'ui-overlay__panel--swipe-block'],
      ['left', 'ui-overlay__panel--swipe-inline'],
      ['right', 'ui-overlay__panel--swipe-inline'],
    ] as const)('gives a panel that swipes %s the %s modifier', async (closeOnSwipe, modifier) => {
      await mount({ closeOnSwipe })

      expect(document.querySelector('.ui-overlay__panel')!.classList).toContain(modifier)
    })

    it('leaves the panel to the browser when a handle or banner starts the swipe', async () => {
      const handle = document.createElement('div')
      await mount({ closeOnSwipe: 'down', swipeTarget: handle })

      const panel = document.querySelector('.ui-overlay__panel')!
      expect(panel.classList).not.toContain('ui-overlay__panel--swipe-block')
    })
  })

  describe('panel scroll', () => {
    const panel = () => document.querySelector('.ui-overlay__panel')!

    it('lets an open modal panel scroll once it has settled, not while it animates', async () => {
      const { model } = await mount({ modelValue: false })

      model.value = true
      await nextTick()
      await nextTick()
      expect(panel().classList).not.toContain('ui-overlay__panel--scrollable')

      await settle()
      expect(panel().classList).toContain('ui-overlay__panel--scrollable')

      model.value = false
      await nextTick()
      expect(panel().classList).not.toContain('ui-overlay__panel--scrollable')
    })

    it('never scrolls a popover panel', async () => {
      await mount({ mode: 'popover' })

      expect(panel().classList).not.toContain('ui-overlay__panel--scrollable')
    })
  })

  describe('gesture guards', () => {
    it('renders both edge guards with prevent-navigation-gestures', async () => {
      await mount({ preventNavigationGestures: true })

      expect(document.querySelector('.ui-overlay__gesture-guard--start')).not.toBeNull()
      expect(document.querySelector('.ui-overlay__gesture-guard--end')).not.toBeNull()
    })

    it('renders no guards by default', async () => {
      await mount()

      expect(document.querySelector('.ui-overlay__gesture-guard')).toBeNull()
    })
  })

  describe('slots', () => {
    it('hands the default slot close, is-top and the overlay id', async () => {
      const scope: Record<string, unknown> = {}
      await mount({}, {
        default: (props: Record<string, unknown>) => {
          Object.assign(scope, props)
          return h('div', 'Panel')
        },
      })

      expect(typeof scope.close).toBe('function')
      expect(scope.isTop).toBe(true)
      expect(typeof scope.overlayId).toBe('string')
    })

    it('hands the activator slot open, close, toggle, is-open and the trigger props', async () => {
      const scope: Record<string, unknown> = {}
      await mount({ modelValue: false }, {
        activator: (props: Record<string, unknown>) => {
          Object.assign(scope, props)
          return h('button', 'Open')
        },
      })

      expect(Object.keys(scope)).toEqual(expect.arrayContaining(['open', 'close', 'toggle', 'isOpen', 'props']))
      expect(scope.isOpen).toBe(false)
    })

    it('renders the panel content in the overlay host', async () => {
      await mount()

      expect(overlayHost().querySelector('.panel-content')?.textContent).toBe('Panel')
    })
  })
})
