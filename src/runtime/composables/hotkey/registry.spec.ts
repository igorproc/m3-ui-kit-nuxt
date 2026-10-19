import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetHotkeyRegistry, isKeyHeld, popScope, pushScope, registerHotkey } from './registry'
import type { HotkeySubscription } from './registry'
import type { HotkeyKey } from '#kit/shared/types/hotkey'

function subscribe(keys: HotkeyKey[], overrides: Partial<HotkeySubscription> = {}) {
  const handler = vi.fn()
  const subscription = registerHotkey({
    getKeys: () => keys,
    getEnabled: () => true,
    getScope: () => undefined,
    getPlatform: () => 'windows',
    isPaused: () => false,
    event: 'keydown',
    inputs: false,
    preventDefault: true,
    stopPropagation: false,
    repeat: false,
    exact: true,
    handler,
    ...overrides,
  })
  return { handler, ...subscription }
}

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = window, type: 'keydown' | 'keyup' = 'keydown') {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

beforeEach(() => __resetHotkeyRegistry())
afterEach(() => {
  __resetHotkeyRegistry()
  vi.restoreAllMocks()
})

describe('matching', () => {
  it.each<[HotkeyKey[], string, KeyboardEventInit, boolean]>([
    [['ctrl', 'arrowup'], 'ArrowUp', { ctrlKey: true }, true],
    [['Control', 'ArrowUp'], 'ArrowUp', { ctrlKey: true }, true],
    [['CTRL', 'up'], 'ArrowUp', { ctrlKey: true }, true],
    [['ctrl', 'arrow-up'], 'ArrowUp', { ctrlKey: true }, true],
    [['mod', 'K'], 'k', { ctrlKey: true }, true],
    [['shift', 'k'], 'K', { shiftKey: true }, true],
    [['escape'], 'Escape', {}, true],
    [['Esc'], 'Esc', {}, true],
    [['space'], ' ', {}, true],
    [['ctrl', 'k'], 'k', {}, false],
    [['ctrl', 'k'], 'k', { ctrlKey: true, shiftKey: true }, false],
    [['ctrl', 'k'], 'j', { ctrlKey: true }, false],
    [['shift'], 'Shift', { shiftKey: true }, false],
  ])('%j against %j %j fires: %s', (keys, key, init, fires) => {
    const { handler } = subscribe(keys)

    press(key, init)

    expect(handler).toHaveBeenCalledTimes(fires ? 1 : 0)
  })

  it('resolves `mod` through the subscription platform', () => {
    const { handler } = subscribe(['mod', 'k'], { getPlatform: () => 'mac' })

    press('k', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()

    press('k', { metaKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls preventDefault only on a match', () => {
    subscribe(['ctrl', 'k'])

    expect(press('j', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(press('k', { ctrlKey: true }).defaultPrevented).toBe(true)
  })

  it('gives the shortcut to the most recent registration', () => {
    const first = subscribe(['ctrl', 'k'])
    const second = subscribe(['ctrl', 'k'])

    press('k', { ctrlKey: true })

    expect(first.handler).not.toHaveBeenCalled()
    expect(second.handler).toHaveBeenCalledTimes(1)
  })

  it('skips disabled and paused subscriptions', () => {
    const disabled = subscribe(['ctrl', 'k'], { getEnabled: () => false })
    const paused = subscribe(['ctrl', 'k'], { isPaused: () => true })

    press('k', { ctrlKey: true })

    expect(disabled.handler).not.toHaveBeenCalled()
    expect(paused.handler).not.toHaveBeenCalled()
  })
})

describe('fields', () => {
  it.each([
    ['input', () => document.createElement('input')],
    ['textarea', () => document.createElement('textarea')],
    ['select', () => document.createElement('select')],
    ['contenteditable', () => {
      const element = document.createElement('div')
      element.contentEditable = 'true'
      return element
    }],
  ])('does not take a keystroke typed into %s', (_, create) => {
    const field = create()
    document.body.appendChild(field)
    const { handler } = subscribe(['ctrl', 'k'])

    const event = press('k', { ctrlKey: true }, field)

    expect(handler).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    field.remove()
  })

  it('takes it when the subscription opts in with inputs', () => {
    const field = document.createElement('input')
    document.body.appendChild(field)
    const { handler } = subscribe(['ctrl', 'k'], { inputs: true })

    press('k', { ctrlKey: true }, field)

    expect(handler).toHaveBeenCalledTimes(1)
    field.remove()
  })
})

describe('layers', () => {
  it('lets only the top layer answer', () => {
    let dialogOpen = true
    const page = subscribe(['ctrl', 'k'], { isOnTopLayer: () => !dialogOpen })
    const dialog = subscribe(['ctrl', 'k'], { isOnTopLayer: () => dialogOpen })

    press('k', { ctrlKey: true })
    expect(dialog.handler).toHaveBeenCalledTimes(1)
    expect(page.handler).not.toHaveBeenCalled()

    dialogOpen = false
    press('k', { ctrlKey: true })
    expect(page.handler).toHaveBeenCalledTimes(1)
    expect(dialog.handler).toHaveBeenCalledTimes(1)
  })

  it('suppresses lower scopes while a scope is pushed', () => {
    const page = subscribe(['ctrl', 'k'])
    const editor = subscribe(['ctrl', 'j'], { getScope: () => 'editor' })

    pushScope('editor')
    press('k', { ctrlKey: true })
    press('j', { ctrlKey: true })
    expect(page.handler).not.toHaveBeenCalled()
    expect(editor.handler).toHaveBeenCalledTimes(1)

    popScope('editor')
    press('k', { ctrlKey: true })
    expect(page.handler).toHaveBeenCalledTimes(1)
  })
})

describe('held keys', () => {
  it('tracks modifiers and keys until they are released', () => {
    subscribe(['mod', 'k'])

    press('Control', { ctrlKey: true })
    press('k', { ctrlKey: true })
    expect(isKeyHeld('mod', 'windows')).toBe(true)
    expect(isKeyHeld('mod', 'mac')).toBe(false)
    expect(isKeyHeld('K', 'windows')).toBe(true)

    press('k', { ctrlKey: true }, window, 'keyup')
    expect(isKeyHeld('k', 'windows')).toBe(false)
    expect(isKeyHeld('ctrl', 'windows')).toBe(true)
  })

  it('forgets everything when the window loses focus', () => {
    subscribe(['mod', 'k'])

    press('k', { ctrlKey: true })
    window.dispatchEvent(new Event('blur'))

    expect(isKeyHeld('ctrl', 'windows')).toBe(false)
    expect(isKeyHeld('k', 'windows')).toBe(false)
  })
})

describe('listeners', () => {
  it('attaches one window listener for the first subscription and removes it after the last', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const keydownCalls = (spy: typeof add | typeof remove) => spy.mock.calls.filter(([type]) => String(type) === 'keydown')

    const first = subscribe(['ctrl', 'k'])
    const second = subscribe(['ctrl', 'j'])
    expect(keydownCalls(add)).toHaveLength(1)

    first.stop()
    expect(keydownCalls(remove)).toHaveLength(0)

    second.stop()
    expect(keydownCalls(remove)).toHaveLength(1)
    press('j', { ctrlKey: true })
    expect(second.handler).not.toHaveBeenCalled()
  })
})

describe('on the server', () => {
  afterEach(() => {
    vi.doUnmock('#kit/shared/constants/globals')
    vi.resetModules()
  })

  it('keeps no state and never touches window or document', async () => {
    vi.resetModules()
    vi.doMock('#kit/shared/constants/globals', () => ({ IN_BROWSER: false }))
    const addToWindow = vi.spyOn(window, 'addEventListener')
    const addToDocument = vi.spyOn(document, 'addEventListener')
    const server = await import('./registry')
    const handler = vi.fn()

    const subscription = server.registerHotkey({
      getKeys: () => ['ctrl', 'k'],
      getEnabled: () => true,
      getScope: () => undefined,
      getPlatform: () => 'windows',
      isPaused: () => false,
      event: 'keydown',
      inputs: false,
      preventDefault: true,
      stopPropagation: false,
      repeat: false,
      exact: true,
      handler,
    })
    server.pushScope('dialog')
    press('k', { ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()
    expect(server.isKeyHeld('ctrl', 'windows')).toBe(false)
    expect(addToWindow.mock.calls.map(([type]) => type)).not.toContain('keydown')
    expect(addToDocument.mock.calls.map(([type]) => type)).not.toContain('visibilitychange')
    expect(() => subscription.stop()).not.toThrow()
  })
})
