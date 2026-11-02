import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MDialog from '../index.vue'
import { mountTracked, overlayHost, settle, until, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

interface Scope { confirm: (payload?: unknown) => void, cancel: () => void, close: () => Promise<void> }

async function mount(props: Record<string, unknown> = {}, slots: Record<string, (scope: Scope) => VNode | string> = {}) {
  const model = ref(Boolean(props.modelValue ?? true))
  const events: string[] = []
  const results: Array<[string, unknown]> = []
  const Harness = defineComponent({
    setup: () => () => h(MDialog, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
      'onOpened': () => events.push('opened'),
      'onClosed': () => events.push('closed'),
      'onConfirm': (payload: unknown) => results.push(['confirm', payload]),
      'onCancel': (reason: unknown) => results.push(['cancel', reason]),
    }, { default: () => 'Body', ...slots }),
  })
  const wrapper = await mountTracked(Harness)
  await settle()
  return { model, events, results, wrapper }
}

const actions = {
  actions: ({ confirm, cancel, close }: Scope) => h('div', [
    h('button', { class: 'ok', onClick: () => confirm('draft-7') }, 'OK'),
    h('button', { class: 'no', onClick: cancel }, 'Cancel'),
    h('button', { class: 'shut', onClick: close }, 'Close'),
  ]),
}

const press = (selector: string) => (overlayHost().querySelector(selector) as HTMLElement).click()

const scrim = () => document.querySelector('.ui-overlay__scrim') as HTMLElement

describe('m-dialog · interaction', () => {
  describe('open state', () => {
    it('does not render while closed', async () => {
      await mount({ modelValue: false })

      expect(overlayHost().querySelector('.ui-dialog')).toBeNull()
    })

    it('opens a native modal <dialog> and forwards the lifecycle events', async () => {
      const { model, events } = await mount({ modelValue: false })

      model.value = true
      await settle()
      expect(overlayHost().querySelector<HTMLDialogElement>('dialog.ui-overlay')!.open).toBe(true)

      model.value = false
      await until(() => events.includes('closed'))
      expect(events).toEqual(['opened', 'closed'])
    })
  })

  describe('dismissal', () => {
    it('closes on a scrim click by default', async () => {
      const { model } = await mount()

      scrim().click()
      await nextTick()

      expect(model.value).toBe(false)
    })

    it('does not close on a scrim click with close-on-outside off', async () => {
      const { model } = await mount({ closeOnOutside: false })

      scrim().click()
      await nextTick()

      expect(model.value).toBe(true)
    })

    it('does not close on Escape when persistent', async () => {
      const { model } = await mount({ persistent: true })

      overlayHost().querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))
      await nextTick()

      expect(model.value).toBe(true)
    })
  })

  describe('result', () => {
    it('confirms with the payload the actions slot passes and closes', async () => {
      const { model, results } = await mount({}, actions)

      press('.ok')
      await nextTick()

      expect(results).toEqual([['confirm', 'draft-7']])
      expect(model.value).toBe(false)
    })

    it('cancels from the actions slot and closes', async () => {
      const { model, results } = await mount({}, actions)

      press('.no')
      await nextTick()

      expect(results).toEqual([['cancel', 'cancel']])
      expect(model.value).toBe(false)
    })

    it('closes from the actions slot without a result', async () => {
      const { model, results } = await mount({}, actions)

      press('.shut')
      await settle()

      expect(results).toEqual([])
      expect(model.value).toBe(false)
    })

    it('hands the default slot the same confirm, cancel and close', async () => {
      const { results } = await mount({}, {
        default: ({ confirm }: Scope) => h('button', { class: 'pick', onClick: () => confirm(0) }, 'Pick'),
      })

      press('.pick')
      await nextTick()

      expect(results).toEqual([['confirm', 0]])
    })

    it.each([
      ['outside', () => press('.ui-overlay__scrim')],
      ['escape', () => overlayHost().querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }))],
    ] as const)('reads a dismissal by %s as a cancel', async (reason, act) => {
      const { model, results } = await mount()

      act()
      await nextTick()

      expect(results).toEqual([['cancel', reason]])
      expect(model.value).toBe(false)
    })

    it('reports nothing when the parent closes it', async () => {
      const { model, results } = await mount()

      model.value = false
      await settle()

      expect(results).toEqual([])
    })

    it('ignores a second answer while closing', async () => {
      const { results } = await mount({}, actions)

      press('.ok')
      press('.no')
      await settle()

      expect(results).toEqual([['confirm', 'draft-7']])
    })
  })

  describe('exposed', () => {
    it('exposes the overlay id and a close() that settles once closed', async () => {
      const { model, wrapper } = await mount()
      const dialog = wrapper.findComponent(MDialog).vm as unknown as { id: string, close: () => Promise<void> }

      expect(typeof dialog.id).toBe('string')
      await Promise.all([dialog.close(), settle()])

      expect(model.value).toBe(false)
    })
  })
})
