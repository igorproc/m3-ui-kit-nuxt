import { describe, expect, it } from 'vitest'
import { MESSAGES } from '#kit/shared/constants/messages'
import {
  buildAriaKeyShortcuts,
  buildAriaLabel,
  buildDisplayKeys,
  normalizeKey,
  parseForMatch,
  platformFromHints,
} from './format'
import type { HotkeyKey, HotkeyKeyLabels, ResolvedHotkeyPlatform } from '#kit/shared/types/hotkey'

const LABELS: HotkeyKeyLabels = MESSAGES.hotkeyKeys

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
const WINDOWS_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
const LINUX_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

describe('normalizeKey', () => {
  it.each<[string, HotkeyKey]>([
    ['arrowup', 'arrow-up'],
    ['ArrowUp', 'arrow-up'],
    ['ARROWUP', 'arrow-up'],
    ['up', 'arrow-up'],
    ['Up', 'arrow-up'],
    ['arrow-up', 'arrow-up'],
    ['arrow_up', 'arrow-up'],
    ['ArrowDown', 'arrow-down'],
    ['left', 'arrow-left'],
    ['ArrowRight', 'arrow-right'],
    ['Escape', 'escape'],
    ['Esc', 'escape'],
    ['ESC', 'escape'],
    ['Return', 'enter'],
    ['Enter', 'enter'],
    [' ', 'space'],
    ['Spacebar', 'space'],
    ['Del', 'delete'],
    ['Backspace', 'backspace'],
    ['Tab', 'tab'],
    ['Control', 'ctrl'],
    ['CTRL', 'ctrl'],
    ['Meta', 'meta'],
    ['Cmd', 'meta'],
    ['Command', 'meta'],
    ['OS', 'meta'],
    ['Win', 'meta'],
    ['Option', 'alt'],
    ['Alt', 'alt'],
    ['Shift', 'shift'],
    ['Mod', 'mod'],
    ['K', 'k'],
    ['k', 'k'],
    ['F12', 'f12'],
    ['PageDown', 'pagedown'],
    ['-', '-'],
    ['+', '+'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeKey(input)).toBe(expected)
  })
})

describe('parseForMatch', () => {
  it.each<[HotkeyKey[], ResolvedHotkeyPlatform, string[], HotkeyKey[]]>([
    [['mod', 'k'], 'mac', ['meta'], ['k']],
    [['mod', 'k'], 'windows', ['ctrl'], ['k']],
    [['Control', 'Shift', 'ArrowUp'], 'linux', ['ctrl', 'shift'], ['arrow-up']],
    [['shift'], 'windows', ['shift'], []],
  ])('%j on %s', (keys, platform, mods, mains) => {
    const { requiredMods, mainKeys } = parseForMatch(keys, platform)
    expect([...requiredMods].sort()).toEqual(mods)
    expect(mainKeys).toEqual(mains)
  })
})

describe('buildDisplayKeys', () => {
  it.each<[HotkeyKey[], ResolvedHotkeyPlatform, string[]]>([
    [['shift', 'mod', 'p'], 'mac', ['⇧', '⌘', 'P']],
    [['mod', 'shift', 'p'], 'windows', ['Ctrl', 'Shift', 'P']],
    [['meta', 'k'], 'linux', ['Super', 'K']],
    [['meta', 'k'], 'windows', ['Win', 'K']],
    [['alt', 'ctrl', 'delete'], 'windows', ['Ctrl', 'Alt', '⌦']],
    [['option', 'escape'], 'mac', ['⌥', '⎋']],
    [['escape'], 'windows', ['Esc']],
    [['arrowup'], 'windows', ['↑']],
    [['ArrowUp'], 'mac', ['↑']],
    [['up'], 'linux', ['↑']],
    [['ArrowLeft', 'ArrowRight', 'down'], 'windows', ['←', '→', '↓']],
    [['Return'], 'mac', ['↵']],
    [[' '], 'windows', ['Space']],
    [['home'], 'windows', ['Home']],
    [['F12'], 'windows', ['F12']],
    [['?'], 'mac', ['?']],
  ])('%j on %s → %j', (keys, platform, symbols) => {
    expect(buildDisplayKeys(keys, platform, LABELS).map(entry => entry.symbol)).toEqual(symbols)
  })

  it('reads spoken names from the label map it is given', () => {
    const labels: HotkeyKeyLabels = { ...LABELS, control: 'Контрол', arrowUp: 'Стрелка вверх' }

    expect(buildDisplayKeys(['ctrl', 'up'], 'windows', labels).map(entry => entry.label)).toEqual(['Контрол', 'Стрелка вверх'])
  })

  it('marks modifiers and keeps the canonical token', () => {
    const [mod, key] = buildDisplayKeys(['Cmd', 'K'], 'mac', LABELS)

    expect(mod).toMatchObject({ key: 'meta', isModifier: true })
    expect(key).toMatchObject({ key: 'k', isModifier: false })
  })
})

describe('buildAriaLabel', () => {
  it.each<[HotkeyKey[], ResolvedHotkeyPlatform, string | undefined, string]>([
    [['shift', 'mod', 'p'], 'mac', undefined, 'Shift Command P'],
    [['mod', 'k'], 'windows', undefined, 'Control K'],
    [['mod', 'k'], 'windows', 'недоступно', 'Control K, недоступно'],
    [['arrowup'], 'windows', undefined, 'Up'],
  ])('%j on %s with state %j', (keys, platform, state, expected) => {
    expect(buildAriaLabel(buildDisplayKeys(keys, platform, LABELS), state)).toBe(expected)
  })
})

describe('buildAriaKeyShortcuts', () => {
  it.each<[HotkeyKey[], ResolvedHotkeyPlatform, string]>([
    [['mod', 'k'], 'windows', 'Control+K'],
    [['mod', 'k'], 'mac', 'Meta+K'],
    [['shift', 'mod', 'p'], 'mac', 'Shift+Meta+P'],
    [['alt', 'arrowup'], 'linux', 'Alt+ArrowUp'],
    [['ctrl', '+'], 'windows', 'Control+Plus'],
    [['Esc'], 'windows', 'Escape'],
    [[' '], 'windows', 'Space'],
    [['ctrl', 'home'], 'windows', 'Control+Home'],
  ])('%j on %s → %s', (keys, platform, expected) => {
    expect(buildAriaKeyShortcuts(keys, platform)).toBe(expected)
  })
})

describe('platformFromHints', () => {
  it.each<[string | undefined, string | undefined, ResolvedHotkeyPlatform | undefined]>([
    ['"macOS"', undefined, 'mac'],
    ['"Windows"', undefined, 'windows'],
    ['"Linux"', undefined, 'linux'],
    ['"Android"', undefined, 'linux'],
    ['"Chrome OS"', undefined, 'linux'],
    ['"iOS"', undefined, 'mac'],
    ['macOS', WINDOWS_UA, 'mac'],
    ['"Unknown"', WINDOWS_UA, 'windows'],
    [undefined, MAC_UA, 'mac'],
    [undefined, IPAD_UA, 'mac'],
    [undefined, WINDOWS_UA, 'windows'],
    [undefined, LINUX_UA, 'linux'],
    [undefined, 'Nuxt prerender', undefined],
    ['', '', undefined],
    [undefined, undefined, undefined],
  ])('hint %j, user agent %j → %j', (hint, userAgent, expected) => {
    expect(platformFromHints(hint, userAgent)).toBe(expected)
  })
})
