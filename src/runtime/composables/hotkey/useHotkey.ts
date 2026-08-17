/**
 * @module hotkey/useHotkey
 *
 * @remarks
 * Registers an application-level shortcut in the global hotkey registry and
 * returns both lifecycle controls and a readonly presentation model. Because the
 * matcher and the `MHotkey` visual read the same `HotkeyDefinition`, the shown
 * hint can never diverge from the registered combination.
 *
 * Local keyboard navigation (arrow keys inside a menu, roving tabindex) is NOT
 * this — that belongs to the owning DOM component.
 */
import { computed, onMounted, onScopeDispose, readonly, ref, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import {
  buildAriaLabel,
  buildDisplayKeys,
  detectPlatform,
  isModifierToken,
  normalizeKeyToken,
  resolveMod,
} from './format'
import { pressedKeys as globalPressedKeys, pressedState, registerHotkey } from './registry'
import type {
  HotkeyDefinition,
  HotkeyKey,
  ResolvedHotkeyPlatform,
  UseHotkeyOptions,
  UseHotkeyReturn,
} from '#kit/shared/types/hotkey'

type HotkeySource = HotkeyKey[] | HotkeyDefinition

/**
 * Register an application shortcut. `source` is either a `HotkeyKey[]` (the
 * primary, typed form) or a reactive `HotkeyDefinition` with an explicit
 * `platform`. Both may be a ref/getter for reactive keys.
 */
export function useHotkey(
  source: MaybeRefOrGetter<HotkeySource>,
  handler: (event: KeyboardEvent) => void,
  options: UseHotkeyOptions = {},
): UseHotkeyReturn {
  const readSource = () => toValue(source)

  const keysGetter = (): HotkeyKey[] => {
    const value = readSource()
    return Array.isArray(value) ? value : value.keys
  }

  const platformOption = () => {
    const value = readSource()
    return (Array.isArray(value) ? 'auto' : value.platform) ?? 'auto'
  }

  const enabled = () => toValue(options.enabled ?? true)
  const scope = () => toValue(options.scope)
  const paused = ref(false)

  // SSR-safe platform: stable neutral on the server, refined after hydration
  // when `auto`. An explicit platform is deterministic on both sides.
  const initialPlatform = platformOption()
  const resolvedPlatform = ref<ResolvedHotkeyPlatform>(
    initialPlatform === 'auto' ? 'windows' : initialPlatform,
  )
  if (initialPlatform === 'auto') {
    onMounted(() => {
      resolvedPlatform.value = detectPlatform()
    })
  }

  const { stop } = registerHotkey({
    getKeys: keysGetter,
    getEnabled: enabled,
    getScope: scope,
    getPlatform: () => resolvedPlatform.value,
    isPaused: () => paused.value,
    event: options.event ?? 'keydown',
    inputs: options.inputs ?? false,
    preventDefault: options.preventDefault ?? true,
    stopPropagation: options.stopPropagation ?? false,
    repeat: options.repeat ?? false,
    exact: options.exact ?? true,
    handler,
  })

  onScopeDispose(stop)

  const canonicalKeys = computed(() => keysGetter().map(key => normalizeKeyToken(String(key))))
  const displayKeys = computed(() => buildDisplayKeys(keysGetter(), resolvedPlatform.value))
  const ariaLabel = computed(() => buildAriaLabel(displayKeys.value))
  const platform = computed(() => resolvedPlatform.value)
  const isActive = computed(() => enabled() && !paused.value)

  function tokenPressed(token: HotkeyKey): boolean {
    if (isModifierToken(token)) {
      const modifier = token === 'mod' ? resolveMod(resolvedPlatform.value) : token
      return pressedState[modifier as 'ctrl' | 'meta' | 'alt' | 'shift']
    }
    return globalPressedKeys.has(token)
  }

  const pressedKeys = computed(() => canonicalKeys.value.filter(tokenPressed))
  const isPressed = computed(() => {
    const def = canonicalKeys.value
    return def.length > 0 && def.every(tokenPressed)
  })

  return {
    keys: canonicalKeys,
    displayKeys,
    ariaLabel,
    platform,
    isActive,
    pressedKeys,
    isPressed,
    isPaused: readonly(paused),
    pause: () => { paused.value = true },
    resume: () => { paused.value = false },
    stop,
  }
}
