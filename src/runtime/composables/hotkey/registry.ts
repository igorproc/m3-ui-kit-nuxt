/**
 * @module hotkey/registry
 *
 * @remarks
 * Global hotkey pub/sub singleton. Keeps at most one real `keydown` and one
 * `keyup` window listener while ≥1 subscription is active and fans normalized,
 * scope-aware events out to subscribers. No new Pinia store; SSR is a no-op
 * (listeners attach only in the browser). Scope stacking (`pushScope`/
 * `popScope`) is the integration point for the future overlay stack — an active
 * scope suppresses matching shortcuts of lower scopes.
 */
import { reactive, shallowReactive } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import {
  isModifierToken,
  normalizeEventKey,
  normalizeKeyToken,
  parseForMatch,
} from './format'
import type { ResolvedModifier } from './format'
import type { HotkeyKey, ResolvedHotkeyPlatform } from '#kit/shared/types/hotkey'

export interface HotkeySubscription {
  getKeys: () => HotkeyKey[]
  getEnabled: () => boolean
  getScope: () => string | undefined
  getPlatform: () => ResolvedHotkeyPlatform
  isPaused: () => boolean
  event: 'keydown' | 'keyup'
  inputs: boolean
  preventDefault: boolean
  stopPropagation: boolean
  repeat: boolean
  exact: boolean
  handler: (event: KeyboardEvent) => void
}

/** Reactive snapshot of currently held keys/modifiers (for visual pressed state). */
export const pressedState = reactive({
  ctrl: false,
  meta: false,
  alt: false,
  shift: false,
})

/** Non-modifier keys currently held down (normalized tokens). */
export const pressedKeys = shallowReactive(new Set<HotkeyKey>())

const subs = new Map<number, HotkeySubscription>()
const activeScopeStack: string[] = []
let nextId = 1
let attached = false

function syncModifierFlags(event: KeyboardEvent) {
  pressedState.ctrl = event.ctrlKey
  pressedState.meta = event.metaKey
  pressedState.alt = event.altKey
  pressedState.shift = event.shiftKey
}

function trackPressed(event: KeyboardEvent, phase: 'keydown' | 'keyup') {
  syncModifierFlags(event)
  const token = normalizeEventKey(event.key)
  if (isModifierToken(token) || token === 'control' || token === 'meta' || token === 'shift' || token === 'alt') return
  if (phase === 'keydown') pressedKeys.add(token)
  else pressedKeys.delete(token)
}

function clearPressed() {
  pressedState.ctrl = pressedState.meta = pressedState.alt = pressedState.shift = false
  pressedKeys.clear()
}

function isEditableTarget(event: KeyboardEvent): boolean {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  for (const node of path) {
    if (!(node instanceof HTMLElement)) continue
    const tag = node.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (node.isContentEditable) return true
  }
  return false
}

function matchesEvent(sub: HotkeySubscription, event: KeyboardEvent): boolean {
  const platform = sub.getPlatform()
  const { requiredMods, mainKeys } = parseForMatch(sub.getKeys().map(k => normalizeKeyToken(String(k))), platform)

  // Modifier-only or multi-main combinations are unsupported in this version.
  if (mainKeys.length !== 1) return false

  const actual = new Set<ResolvedModifier>()
  if (event.ctrlKey) actual.add('ctrl')
  if (event.metaKey) actual.add('meta')
  if (event.altKey) actual.add('alt')
  if (event.shiftKey) actual.add('shift')

  if (sub.exact) {
    if (actual.size !== requiredMods.size) return false
    for (const mod of requiredMods) if (!actual.has(mod)) return false
  } else {
    for (const mod of requiredMods) if (!actual.has(mod)) return false
  }

  return normalizeEventKey(event.key) === mainKeys[0]
}

function comboSignature(sub: HotkeySubscription): string {
  const platform = sub.getPlatform()
  const { requiredMods, mainKeys } = parseForMatch(sub.getKeys().map(k => normalizeKeyToken(String(k))), platform)
  return `${(sub.getScope() ?? 'root')}|${[...requiredMods].sort().join('+')}|${mainKeys.join('+')}`
}

function dispatch(event: KeyboardEvent, phase: 'keydown' | 'keyup') {
  trackPressed(event, phase)

  if (event.isComposing) return

  const currentScope = activeScopeStack.length
    ? activeScopeStack[activeScopeStack.length - 1]
    : undefined

  // Recency order: the most recently registered eligible subscription wins.
  const ordered = [...subs.values()].reverse()
  const matched: HotkeySubscription[] = []

  for (const sub of ordered) {
    if (sub.event !== phase) continue
    if (!sub.getEnabled() || sub.isPaused()) continue
    if (currentScope !== undefined && (sub.getScope() ?? 'root') !== currentScope) continue
    if (!sub.inputs && isEditableTarget(event)) continue
    if (event.repeat && !sub.repeat) continue
    if (matchesEvent(sub, event)) matched.push(sub)
  }

  if (!matched.length) return

  if (import.meta.dev) {
    const seen = new Set<string>()
    for (const sub of matched) {
      const sig = comboSignature(sub)
      if (seen.has(sig)) {
        console.warn(`[m3:hotkey] duplicate shortcut in the same active scope: ${sig}`)
      }
      seen.add(sig)
    }
  }

  const winner = matched[0]!
  if (winner.preventDefault) event.preventDefault()
  if (winner.stopPropagation) event.stopPropagation()
  winner.handler(event)
}

const onKeydown = (event: Event) => dispatch(event as KeyboardEvent, 'keydown')
const onKeyup = (event: Event) => dispatch(event as KeyboardEvent, 'keyup')
const onReset = () => clearPressed()

function ensureListeners() {
  if (attached || !IN_BROWSER) return
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
  window.addEventListener('blur', onReset)
  document.addEventListener('visibilitychange', onReset)
  attached = true
}

function maybeDetach() {
  if (!attached || subs.size > 0) return
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
  window.removeEventListener('blur', onReset)
  document.removeEventListener('visibilitychange', onReset)
  attached = false
  clearPressed()
}

/** Register a hotkey subscription. Returns a `stop` for manual removal. */
export function registerHotkey(sub: HotkeySubscription): { stop: () => void } {
  if (!IN_BROWSER) return { stop: () => {} }

  if (import.meta.dev) {
    const { mainKeys } = parseForMatch(sub.getKeys().map(k => normalizeKeyToken(String(k))), sub.getPlatform())
    if (mainKeys.length === 0) {
      console.warn('[m3:hotkey] modifier-only shortcuts are not supported and will never fire.')
    }
  }

  const id = nextId++
  subs.set(id, sub)
  ensureListeners()

  return {
    stop: () => {
      if (subs.delete(id)) maybeDetach()
    },
  }
}

/** Activate a scope (e.g. when an overlay opens): suppresses lower scopes. */
export function pushScope(scope: string): void {
  activeScopeStack.push(scope)
}

/** Deactivate a scope (removes its most recent activation). */
export function popScope(scope: string): void {
  const index = activeScopeStack.lastIndexOf(scope)
  if (index !== -1) activeScopeStack.splice(index, 1)
}

/** Test-only: reset all registry state. */
export function __resetHotkeyRegistry(): void {
  subs.clear()
  activeScopeStack.length = 0
  clearPressed()
  maybeDetach()
}
