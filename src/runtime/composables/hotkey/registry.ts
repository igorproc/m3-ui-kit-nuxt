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
import { effectScope, reactive, shallowReactive } from 'vue'
import type { EffectScope } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import {
  isModifierToken,
  normalizeKey,
  parseForMatch,
  resolveMod,
} from './format'
import type { ResolvedModifier } from './format'
import type { HotkeyKey, ResolvedHotkeyPlatform } from '#kit/shared/types/hotkey'

export interface HotkeySubscription {
  getKeys: () => HotkeyKey[]
  getEnabled: () => boolean
  getScope: () => string | undefined
  getPlatform: () => ResolvedHotkeyPlatform
  isPaused: () => boolean
  isOnTopLayer?: () => boolean
  event: 'keydown' | 'keyup'
  inputs: boolean
  preventDefault: boolean
  stopPropagation: boolean
  repeat: boolean
  exact: boolean
  handler: (event: KeyboardEvent) => void
}

interface HotkeyRegistry {
  subscriptions: Set<HotkeySubscription>
  scopes: string[]
  modifiers: Record<ResolvedModifier, boolean>
  keys: Set<HotkeyKey>
  listeners: EffectScope | undefined
}

function createRegistry(): HotkeyRegistry {
  return {
    subscriptions: new Set(),
    scopes: [],
    modifiers: reactive({ ctrl: false, meta: false, alt: false, shift: false }),
    keys: shallowReactive(new Set<HotkeyKey>()),
    listeners: undefined,
  }
}

const registry: HotkeyRegistry | undefined = IN_BROWSER ? createRegistry() : undefined

function syncModifierFlags(state: HotkeyRegistry, event: KeyboardEvent) {
  state.modifiers.ctrl = event.ctrlKey
  state.modifiers.meta = event.metaKey
  state.modifiers.alt = event.altKey
  state.modifiers.shift = event.shiftKey
}

function trackPressed(state: HotkeyRegistry, event: KeyboardEvent, phase: 'keydown' | 'keyup') {
  syncModifierFlags(state, event)
  const token = normalizeKey(event.key)
  if (isModifierToken(token)) return
  if (phase === 'keydown') state.keys.add(token)
  else state.keys.delete(token)
}

function clearPressed(state: HotkeyRegistry) {
  state.modifiers.ctrl = state.modifiers.meta = state.modifiers.alt = state.modifiers.shift = false
  state.keys.clear()
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
  const { requiredMods, mainKeys } = parseForMatch(sub.getKeys(), sub.getPlatform())

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

  return normalizeKey(event.key) === mainKeys[0]
}

function comboSignature(sub: HotkeySubscription): string {
  const { requiredMods, mainKeys } = parseForMatch(sub.getKeys(), sub.getPlatform())
  return `${(sub.getScope() ?? 'root')}|${[...requiredMods].sort().join('+')}|${mainKeys.join('+')}`
}

function dispatch(state: HotkeyRegistry, event: KeyboardEvent, phase: 'keydown' | 'keyup') {
  trackPressed(state, event, phase)

  if (event.isComposing) return

  const currentScope = state.scopes.at(-1)

  // Recency order: the most recently registered eligible subscription wins.
  const ordered = [...state.subscriptions].reverse()
  const matched: HotkeySubscription[] = []

  for (const sub of ordered) {
    if (sub.event !== phase) continue
    if (!sub.getEnabled() || sub.isPaused()) continue
    if (sub.isOnTopLayer && !sub.isOnTopLayer()) continue
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

function ensureListeners(state: HotkeyRegistry) {
  if (state.listeners) return
  const scope = effectScope(true)
  scope.run(() => {
    useGlobalListener('window', 'keydown', event => dispatch(state, event as KeyboardEvent, 'keydown'))
    useGlobalListener('window', 'keyup', event => dispatch(state, event as KeyboardEvent, 'keyup'))
    useGlobalListener('window', 'blur', () => clearPressed(state))
    useGlobalListener('document', 'visibilitychange', () => clearPressed(state))
  })
  state.listeners = scope
}

function maybeDetach(state: HotkeyRegistry) {
  if (!state.listeners || state.subscriptions.size > 0) return
  state.listeners.stop()
  state.listeners = undefined
  clearPressed(state)
}

/** Register a hotkey subscription. Returns a `stop` for manual removal. */
export function registerHotkey(sub: HotkeySubscription): { stop: () => void } {
  const state = registry
  if (!state) return { stop: () => {} }

  if (import.meta.dev) {
    const { mainKeys } = parseForMatch(sub.getKeys(), sub.getPlatform())
    if (mainKeys.length === 0) {
      console.warn('[m3:hotkey] modifier-only shortcuts are not supported and will never fire.')
    }
  }

  state.subscriptions.add(sub)
  ensureListeners(state)

  return {
    stop: () => {
      if (state.subscriptions.delete(sub)) maybeDetach(state)
    },
  }
}

export function isKeyHeld(token: HotkeyKey, platform: ResolvedHotkeyPlatform): boolean {
  if (!registry) return false
  const key = normalizeKey(String(token))
  if (key === 'mod') return registry.modifiers[resolveMod(platform)]
  if (isModifierToken(key)) return registry.modifiers[key as ResolvedModifier]
  return registry.keys.has(key)
}

/** Activate a scope (e.g. when an overlay opens): suppresses lower scopes. */
export function pushScope(scope: string): void {
  registry?.scopes.push(scope)
}

/** Deactivate a scope (removes its most recent activation). */
export function popScope(scope: string): void {
  if (!registry) return
  const index = registry.scopes.lastIndexOf(scope)
  if (index !== -1) registry.scopes.splice(index, 1)
}

/** Test-only: reset all registry state. */
export function __resetHotkeyRegistry(): void {
  if (!registry) return
  registry.subscriptions.clear()
  registry.scopes.length = 0
  clearPressed(registry)
  maybeDetach(registry)
}
