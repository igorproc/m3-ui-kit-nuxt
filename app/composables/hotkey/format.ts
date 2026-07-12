/**
 * @module hotkey/format
 *
 * @remarks
 * Shared normalization + presentation for the hotkey system. Both the matcher
 * (registry) and the visual (`MHotkey`) resolve keys through here, so the label
 * shown to the user and the combination actually matched are derived from one
 * source. No DOM, no listeners.
 */
import { IN_BROWSER } from '~~/shared/constants/globals'
import type {
  HotkeyDisplayKey,
  HotkeyKey,
  ResolvedHotkeyPlatform,
} from '~~/shared/types/hotkey'

/** Physical modifier tokens (excludes the `mod` abstraction). */
export type ResolvedModifier = 'ctrl' | 'meta' | 'alt' | 'shift'

const MODIFIER_TOKENS = new Set(['mod', 'ctrl', 'meta', 'alt', 'shift'])

/** Aliases → canonical token. */
const KEY_ALIASES: Record<string, HotkeyKey> = {
  'esc': 'escape',
  'return': 'enter',
  ' ': 'space',
  'spacebar': 'space',
  'del': 'delete',
  'up': 'arrow-up',
  'down': 'arrow-down',
  'left': 'arrow-left',
  'right': 'arrow-right',
  'control': 'ctrl',
  'command': 'meta',
  'cmd': 'meta',
  'option': 'alt',
  'opt': 'alt',
  'win': 'meta',
  'windows': 'meta',
  'super': 'meta',
}

/** `KeyboardEvent.key` → canonical token. */
const EVENT_KEY_MAP: Record<string, HotkeyKey> = {
  ' ': 'space',
  'Escape': 'escape',
  'Esc': 'escape',
  'Enter': 'enter',
  'Tab': 'tab',
  'Backspace': 'backspace',
  'Delete': 'delete',
  'ArrowUp': 'arrow-up',
  'ArrowDown': 'arrow-down',
  'ArrowLeft': 'arrow-left',
  'ArrowRight': 'arrow-right',
}

/** Normalize an authored key token (case-insensitive, alias-aware). */
export function normalizeKeyToken(token: string): HotkeyKey {
  const lower = token.length === 1 ? token.toLowerCase() : token.toLowerCase()
  return KEY_ALIASES[lower] ?? lower
}

/** Normalize a live `KeyboardEvent.key` to a canonical token. */
export function normalizeEventKey(key: string): HotkeyKey {
  return EVENT_KEY_MAP[key] ?? key.toLowerCase()
}

export function isModifierToken(token: string): boolean {
  return MODIFIER_TOKENS.has(token)
}

/** SSR-safe platform detection (server returns a stable neutral `windows`). */
export function detectPlatform(): ResolvedHotkeyPlatform {
  if (!IN_BROWSER) return 'windows'
  const platform = navigator.platform || ''
  const ua = navigator.userAgent || ''
  if (/Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X|iPhone|iPad/.test(ua)) return 'mac'
  if (/Linux/.test(platform) || /Linux/.test(ua)) return 'linux'
  return 'windows'
}

/** Which physical modifier `mod` maps to on the given platform. */
export function resolveMod(platform: ResolvedHotkeyPlatform): ResolvedModifier {
  return platform === 'mac' ? 'meta' : 'ctrl'
}

/** Parse a key list into the required modifier set and non-modifier keys. */
export function parseForMatch(
  keys: readonly HotkeyKey[],
  platform: ResolvedHotkeyPlatform,
): { requiredMods: Set<ResolvedModifier>, mainKeys: HotkeyKey[] } {
  const requiredMods = new Set<ResolvedModifier>()
  const mainKeys: HotkeyKey[] = []

  for (const raw of keys) {
    const token = normalizeKeyToken(String(raw))
    if (token === 'mod') requiredMods.add(resolveMod(platform))
    else if (isModifierToken(token)) requiredMods.add(token as ResolvedModifier)
    else mainKeys.push(token)
  }

  return { requiredMods, mainKeys }
}

const MODIFIER_ORDER: Record<ResolvedModifier, number> = { ctrl: 0, alt: 1, shift: 2, meta: 3 }

function effectiveModifier(token: HotkeyKey, platform: ResolvedHotkeyPlatform): ResolvedModifier {
  return token === 'mod' ? resolveMod(platform) : (token as ResolvedModifier)
}

/** Spoken label + glyph for a single canonical token. */
function displayForToken(token: HotkeyKey, platform: ResolvedHotkeyPlatform): HotkeyDisplayKey {
  const mac = platform === 'mac'

  if (isModifierToken(token)) {
    const resolved = effectiveModifier(token, platform)
    switch (resolved) {
      case 'meta':
        return mac
          ? { key: token, label: 'Command', symbol: '⌘', isModifier: true }
          : platform === 'linux'
            ? { key: token, label: 'Super', symbol: 'Super', isModifier: true }
            : { key: token, label: 'Windows', symbol: 'Win', isModifier: true }
      case 'ctrl':
        return { key: token, label: 'Control', symbol: mac ? '⌃' : 'Ctrl', isModifier: true }
      case 'alt':
        return mac
          ? { key: token, label: 'Option', symbol: '⌥', isModifier: true }
          : { key: token, label: 'Alt', symbol: 'Alt', isModifier: true }
      case 'shift':
        return { key: token, label: 'Shift', symbol: mac ? '⇧' : 'Shift', isModifier: true }
    }
  }

  switch (token) {
    case 'enter': return { key: token, label: 'Enter', symbol: '↵', isModifier: false }
    case 'escape': return { key: token, label: 'Escape', symbol: mac ? '⎋' : 'Esc', isModifier: false }
    case 'space': return { key: token, label: 'Space', symbol: 'Space', isModifier: false }
    case 'tab': return { key: token, label: 'Tab', symbol: '⇥', isModifier: false }
    case 'backspace': return { key: token, label: 'Backspace', symbol: '⌫', isModifier: false }
    case 'delete': return { key: token, label: 'Delete', symbol: '⌦', isModifier: false }
    case 'arrow-up': return { key: token, label: 'Up', symbol: '↑', isModifier: false }
    case 'arrow-down': return { key: token, label: 'Down', symbol: '↓', isModifier: false }
    case 'arrow-left': return { key: token, label: 'Left', symbol: '←', isModifier: false }
    case 'arrow-right': return { key: token, label: 'Right', symbol: '→', isModifier: false }
  }

  const upper = String(token).toUpperCase()
  return { key: token, label: upper, symbol: upper, isModifier: false }
}

/** Build the ordered display model: normalized modifiers first, then keys. */
export function buildDisplayKeys(
  keys: readonly HotkeyKey[],
  platform: ResolvedHotkeyPlatform,
): HotkeyDisplayKey[] {
  const mods: HotkeyKey[] = []
  const mains: HotkeyKey[] = []

  for (const raw of keys) {
    const token = normalizeKeyToken(String(raw))
    if (isModifierToken(token)) mods.push(token)
    else mains.push(token)
  }

  mods.sort((a, b) => MODIFIER_ORDER[effectiveModifier(a, platform)] - MODIFIER_ORDER[effectiveModifier(b, platform)])

  return [...mods, ...mains].map(token => displayForToken(token, platform))
}

/** Spoken accessible label, e.g. `Command Shift P`. */
export function buildAriaLabel(displayKeys: readonly HotkeyDisplayKey[]): string {
  return displayKeys.map(entry => entry.label).join(' ')
}
