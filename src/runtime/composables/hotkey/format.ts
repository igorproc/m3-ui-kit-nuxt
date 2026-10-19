/**
 * @module hotkey/format
 *
 * @remarks
 * Shared normalization + presentation for the hotkey system. Both the matcher
 * (registry) and the visual (`MHotkey`) resolve keys through here, so the label
 * shown to the user and the combination actually matched are derived from one
 * source. No DOM, no listeners.
 */
import type {
  HotkeyDisplayKey,
  HotkeyKey,
  HotkeyKeyLabels,
  ResolvedHotkeyPlatform,
} from '#kit/shared/types/hotkey'

/** Physical modifier tokens (excludes the `mod` abstraction). */
export type ResolvedModifier = 'ctrl' | 'meta' | 'alt' | 'shift'

const MODIFIER_TOKENS = new Set(['mod', 'ctrl', 'meta', 'alt', 'shift'])

/** Aliases → canonical token. */
const KEY_ALIASES: Record<string, HotkeyKey> = {
  mod: 'mod',
  ctrl: 'ctrl',
  control: 'ctrl',
  meta: 'meta',
  command: 'meta',
  cmd: 'meta',
  win: 'meta',
  windows: 'meta',
  super: 'meta',
  os: 'meta',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
  enter: 'enter',
  return: 'enter',
  escape: 'escape',
  esc: 'escape',
  space: 'space',
  spacebar: 'space',
  tab: 'tab',
  backspace: 'backspace',
  delete: 'delete',
  del: 'delete',
  arrowup: 'arrow-up',
  up: 'arrow-up',
  arrowdown: 'arrow-down',
  down: 'arrow-down',
  arrowleft: 'arrow-left',
  left: 'arrow-left',
  arrowright: 'arrow-right',
  right: 'arrow-right',
}

interface NamedKey {
  label: keyof HotkeyKeyLabels
  symbol: string
  macSymbol?: string
  aria: string
}

const NAMED_KEYS: Record<string, NamedKey> = {
  'enter': { label: 'enter', symbol: '↵', aria: 'Enter' },
  'escape': { label: 'escape', symbol: 'Esc', macSymbol: '⎋', aria: 'Escape' },
  'space': { label: 'space', symbol: 'Space', aria: 'Space' },
  'tab': { label: 'tab', symbol: '⇥', aria: 'Tab' },
  'backspace': { label: 'backspace', symbol: '⌫', aria: 'Backspace' },
  'delete': { label: 'delete', symbol: '⌦', aria: 'Delete' },
  'arrow-up': { label: 'arrowUp', symbol: '↑', aria: 'ArrowUp' },
  'arrow-down': { label: 'arrowDown', symbol: '↓', aria: 'ArrowDown' },
  'arrow-left': { label: 'arrowLeft', symbol: '←', aria: 'ArrowLeft' },
  'arrow-right': { label: 'arrowRight', symbol: '→', aria: 'ArrowRight' },
}

const ARIA_MODIFIERS: Record<ResolvedModifier, string> = {
  ctrl: 'Control',
  meta: 'Meta',
  alt: 'Alt',
  shift: 'Shift',
}

const PLATFORM_HINTS: Record<string, ResolvedHotkeyPlatform> = {
  'macos': 'mac',
  'ios': 'mac',
  'windows': 'windows',
  'linux': 'linux',
  'android': 'linux',
  'chrome os': 'linux',
  'chromium os': 'linux',
}

/** Normalize an authored key token (case-insensitive, alias-aware). */
export function normalizeKey(token: string): HotkeyKey {
  if (token === ' ') return 'space'
  if (token.length === 1) return token.toLowerCase()
  const compact = token.trim().toLowerCase().replace(/[\s_-]+/g, '')
  return KEY_ALIASES[compact] ?? compact
}

export function isModifierToken(token: string): boolean {
  return MODIFIER_TOKENS.has(token)
}

export function platformFromHints(hint?: string, userAgent?: string): ResolvedHotkeyPlatform | undefined {
  const fromHint = hint ? PLATFORM_HINTS[hint.replace(/"/g, '').trim().toLowerCase()] : undefined
  if (fromHint) return fromHint
  if (!userAgent) return undefined
  if (/Mac OS X|Macintosh|iPhone|iPad|iPod/.test(userAgent)) return 'mac'
  if (/Windows/.test(userAgent)) return 'windows'
  if (/Linux/.test(userAgent)) return 'linux'
  return undefined
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
    const token = normalizeKey(String(raw))
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

function legend(token: HotkeyKey): string {
  return token.length === 1 ? token.toUpperCase() : token.charAt(0).toUpperCase() + token.slice(1)
}

/** Spoken label + glyph for a single canonical token. */
function displayForToken(token: HotkeyKey, platform: ResolvedHotkeyPlatform, labels: HotkeyKeyLabels): HotkeyDisplayKey {
  const mac = platform === 'mac'

  if (isModifierToken(token)) {
    const resolved = effectiveModifier(token, platform)
    switch (resolved) {
      case 'meta':
        return mac
          ? { key: token, label: labels.command, symbol: '⌘', isModifier: true }
          : platform === 'linux'
            ? { key: token, label: labels.super, symbol: 'Super', isModifier: true }
            : { key: token, label: labels.windows, symbol: 'Win', isModifier: true }
      case 'ctrl':
        return { key: token, label: labels.control, symbol: mac ? '⌃' : 'Ctrl', isModifier: true }
      case 'alt':
        return mac
          ? { key: token, label: labels.option, symbol: '⌥', isModifier: true }
          : { key: token, label: labels.alt, symbol: 'Alt', isModifier: true }
      case 'shift':
        return { key: token, label: labels.shift, symbol: mac ? '⇧' : 'Shift', isModifier: true }
    }
  }

  const named = NAMED_KEYS[token]
  if (named) {
    return { key: token, label: labels[named.label], symbol: (mac && named.macSymbol) || named.symbol, isModifier: false }
  }

  const text = legend(token)
  return { key: token, label: text, symbol: text, isModifier: false }
}

function orderTokens(keys: readonly HotkeyKey[], platform: ResolvedHotkeyPlatform): HotkeyKey[] {
  const mods: HotkeyKey[] = []
  const mains: HotkeyKey[] = []

  for (const raw of keys) {
    const token = normalizeKey(String(raw))
    if (isModifierToken(token)) mods.push(token)
    else mains.push(token)
  }

  mods.sort((a, b) => MODIFIER_ORDER[effectiveModifier(a, platform)] - MODIFIER_ORDER[effectiveModifier(b, platform)])

  return [...mods, ...mains]
}

/** Build the ordered display model: normalized modifiers first, then keys. */
export function buildDisplayKeys(
  keys: readonly HotkeyKey[],
  platform: ResolvedHotkeyPlatform,
  labels: HotkeyKeyLabels,
): HotkeyDisplayKey[] {
  return orderTokens(keys, platform).map(token => displayForToken(token, platform, labels))
}

/** Spoken accessible label, e.g. `Command Shift P`. */
export function buildAriaLabel(displayKeys: readonly HotkeyDisplayKey[], state?: string): string {
  const name = displayKeys.map(entry => entry.label).join(' ')
  return state ? `${name}, ${state}` : name
}

function ariaKeyName(token: HotkeyKey, platform: ResolvedHotkeyPlatform): string {
  if (isModifierToken(token)) return ARIA_MODIFIERS[effectiveModifier(token, platform)]
  if (token === '+') return 'Plus'
  return NAMED_KEYS[token]?.aria ?? legend(token)
}

export function buildAriaKeyShortcuts(keys: readonly HotkeyKey[], platform: ResolvedHotkeyPlatform): string {
  return orderTokens(keys, platform).map(token => ariaKeyName(token, platform)).join('+')
}
