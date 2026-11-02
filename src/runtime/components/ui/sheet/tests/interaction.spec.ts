import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MSheet from '../index.vue'
import { mountTracked, overlayHost, settle, until, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

interface Scope { confirm: (payload?: unknown) => void, cancel: () => void, close: () => Promise<void> }

async function mount(props: Record<string, unknown> = {}, content: (scope: Scope) => VNode | string = () => h('p', { class: 'body' }, 'Body')) {
  const model = ref(Boolean(props.modelValue ?? true))
  const events: string[] = []
  const results: Array<[string, unknown]> = []
  const Harness = defineComponent({
    setup: () => () => h(MSheet, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
      'onOpened': () => events.push('opened'),
      'onClosed': () => events.push('closed'),
      'onConfirm': (payload: unknown) => results.push(['confirm', payload]),
      'onCancel': (reason: unknown) => results.push(['cancel', reason]),
    }, { default: content }),
  })
  const wrapper = await mountTracked(Harness)
  await settle()
  return { model, events, results, wrapper }
}

/** Drags from `start` by `distance` down, the way a finger pulls a sheet. */
function dragDown(start: Element, distance: number) {
  start.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }))
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100 + distance }))
  window.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 100 + distance }))
}

describe('m-sheet · interaction', () => {
  describe('open state', () => {
    it('renders nothing while closed', async () => {
      await mount({ modelValue: false })

      expect(overlayHost().querySelector('.ui-sheet')).toBeNull()
    })

    it('opens and closes through v-model, forwarding the lifecycle events', async () => {
      const { model, events } = await mount({ modelValue: false })

      model.value = true
      await settle()
      expect(overlayHost().querySelector('.ui-sheet__content')!.textContent).toContain('Body')

      model.value = false
      await until(() => events.includes('closed'))
      expect(events).toEqual(['opened', 'closed'])
    })
  })

  describe('dismissal', () => {
    it('closes on a scrim click', async () => {
      const { model } = await mount()

      ;(overlayHost().querySelector('.ui-overlay__scrim') as HTMLElement).click()
      await nextTick()

      expect(model.value).toBe(false)
    })

    it('closes on the native close request', async () => {
      const { model } = await mount()

      overlayHost().querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
      await nextTick()

      expect(model.value).toBe(false)
    })
  })

  describe('result', () => {
    it('confirms and cancels from the default slot scope', async () => {
      const { results } = await mount({}, ({ confirm }) => h('button', { class: 'ok', onClick: () => confirm('copy-link') }, 'OK'))

      ;(overlayHost().querySelector('.ok') as HTMLElement).click()
      await nextTick()

      expect(results).toEqual([['confirm', 'copy-link']])
    })

    it('reads a scrim dismissal as a cancel', async () => {
      const { results } = await mount()

      ;(overlayHost().querySelector('.ui-overlay__scrim') as HTMLElement).click()
      await nextTick()

      expect(results).toEqual([['cancel', 'outside']])
    })
  })

  describe('swipe', () => {
    beforeEach(() => {
      document.documentElement.style.fontSize = '1px'
    })

    afterEach(() => {
      document.documentElement.style.fontSize = ''
    })

    it('closes on a downward swipe from the drag handle and reads it as a cancel', async () => {
      const { model, results } = await mount()

      dragDown(overlayHost().querySelector('.ui-sheet__drag-handle')!, 200)
      await nextTick()

      expect(results).toEqual([['cancel', 'swipe']])
      expect(model.value).toBe(false)
    })

    it('closes past the M3 positional threshold of 56', async () => {
      const { model } = await mount()

      dragDown(overlayHost().querySelector('.ui-sheet__drag-handle')!, 60)
      await nextTick()

      expect(model.value).toBe(false)
    })

    it('snaps back from a swipe shorter than the threshold', async () => {
      const { model } = await mount()

      dragDown(overlayHost().querySelector('.ui-sheet__drag-handle')!, 20)
      await nextTick()

      expect(model.value).toBe(true)
    })

    // The body scrolls: a swipe only starts on the handle.
    it('does not close on a swipe that starts in the content', async () => {
      const { model } = await mount()

      dragDown(overlayHost().querySelector('.ui-sheet__content .body')!, 200)
      await nextTick()

      expect(model.value).toBe(true)
    })

    it('does not close on a swipe with close-on-swipe none', async () => {
      const { model } = await mount({ closeOnSwipe: 'none' })

      dragDown(overlayHost().querySelector('.ui-sheet')!, 200)
      await nextTick()

      expect(model.value).toBe(true)
    })
  })

  describe('exposed', () => {
    it('exposes the overlay id and a close() that settles once closed', async () => {
      const { model, wrapper } = await mount()
      const sheet = wrapper.findComponent(MSheet).vm as unknown as { id: string, close: () => Promise<void> }

      expect(typeof sheet.id).toBe('string')
      await Promise.all([sheet.close(), settle()])

      expect(model.value).toBe(false)
    })
  })
})
