import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
import { useOverlayDismiss } from './useOverlayDismiss'

const keydown = vi.hoisted(() => ({ live: 0 }))

vi.mock('#kit/composables/useGlobalListener', async (importOriginal) => {
  const original = await importOriginal<typeof import('#kit/composables/useGlobalListener')>()
  return {
    ...original,
    useGlobalListener: (...args: Parameters<typeof original.useGlobalListener>) => {
      const stop = original.useGlobalListener(...args)
      if (args[1] !== 'keydown') return stop
      keydown.live++
      let stopped = false
      return () => {
        if (!stopped) keydown.live--
        stopped = true
        stop()
      }
    },
  }
})

const cleanups: Array<() => void> = []

afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup())
})

function trackPointerdown() {
  const live = new Set<EventListenerOrEventListenerObject>()
  const add = document.addEventListener.bind(document)
  const remove = document.removeEventListener.bind(document)
  document.addEventListener = ((event: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
    if (event === 'pointerdown') live.add(listener)
    add(event, listener, options)
  }) as typeof document.addEventListener
  document.removeEventListener = ((event: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
    if (event === 'pointerdown') live.delete(listener)
    remove(event, listener, options)
  }) as typeof document.removeEventListener
  cleanups.push(() => {
    document.addEventListener = add
    document.removeEventListener = remove
  })
  return live
}

function setup(open: boolean) {
  const isOpen = ref(open)
  const panel = document.createElement('div')
  document.body.append(panel)
  const close = vi.fn()
  const onDismiss = vi.fn()
  const scope = effectScope()
  scope.run(() => useOverlayDismiss({
    policy: () => ({ persistent: false, closeOnOutside: true, closeOnEscape: true, closeOnSwipe: 'none' }),
    isOpen: () => isOpen.value,
    isTop: () => true,
    receivesCloseRequests: () => false,
    hasScrim: () => false,
    panel: shallowRef(panel),
    close,
    onDismiss,
    onClickOutside: () => {},
  }))
  cleanups.push(() => {
    scope.stop()
    panel.remove()
  })
  return { isOpen, close, onDismiss, scope }
}

function pressOutside() {
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
}

describe('useOverlayDismiss', () => {
  it('holds no window keydown and no outside-press listener while closed', async () => {
    const pointerdown = trackPointerdown()
    const before = keydown.live
    const { isOpen } = setup(false)

    expect(keydown.live).toBe(before)
    expect(pointerdown.size).toBe(0)

    isOpen.value = true
    await nextTick()
    expect(keydown.live).toBe(before + 1)
    expect(pointerdown.size).toBe(1)

    isOpen.value = false
    await nextTick()
    expect(keydown.live).toBe(before)
    expect(pointerdown.size).toBe(0)
  })

  it('answers Escape and an outside press while open, with the reason', () => {
    const { onDismiss, close } = setup(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    pressOutside()

    expect(onDismiss.mock.calls).toEqual([['escape'], ['outside']])
    expect(close).toHaveBeenCalledTimes(2)
  })

  it('lets go of its listeners when its scope ends while open', () => {
    const pointerdown = trackPointerdown()
    const before = keydown.live
    const { scope } = setup(true)

    scope.stop()

    expect(keydown.live).toBe(before)
    expect(pointerdown.size).toBe(0)
  })
})
