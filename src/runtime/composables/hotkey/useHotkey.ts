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
import { computed, onScopeDispose, readonly, ref, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { tryUseNuxtApp } from '#app'
import { injectModalContext } from '#kit/composables/modal/useModalContext'
import { isKeyHeld, registerHotkey } from './registry'
import { useHotkeyPresentation } from './useHotkeyPresentation'
import type {
  HotkeyDefinition,
  HotkeyKey,
  HotkeyPlatform,
  UseHotkeyOptions,
  UseHotkeyReturn,
} from '#kit/shared/types/hotkey'

type HotkeySource = HotkeyKey[] | HotkeyDefinition

function useTopLayer(): () => boolean {
  const modal = injectModalContext()
  const service = tryUseNuxtApp()?.$material?.modal
  if (!service) return () => true

  const ownLayer = () => {
    for (let context = modal; context; context = context.parent) {
      const id = context.id
      if (service.modals.some(entry => entry.id === id)) return id
    }
    return undefined
  }

  return () => service.openedModals.at(-1)?.id === ownLayer()
}

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

  const platformOption = (): HotkeyPlatform => {
    const value = readSource()
    return (Array.isArray(value) ? 'auto' : value.platform) ?? 'auto'
  }

  const enabled = () => toValue(options.enabled ?? true)
  const scope = () => toValue(options.scope)
  const paused = ref(false)

  const presentation = useHotkeyPresentation({
    keys: keysGetter,
    platform: platformOption,
    active: () => enabled() && !paused.value,
    isHeld: isKeyHeld,
  })

  const { stop } = registerHotkey({
    getKeys: keysGetter,
    getEnabled: enabled,
    getScope: scope,
    getPlatform: () => presentation.platform.value,
    isPaused: () => paused.value,
    isOnTopLayer: useTopLayer(),
    event: options.event ?? 'keydown',
    inputs: options.inputs ?? false,
    preventDefault: options.preventDefault ?? true,
    stopPropagation: options.stopPropagation ?? false,
    repeat: options.repeat ?? false,
    exact: options.exact ?? true,
    handler,
  })

  onScopeDispose(stop)

  const isPressed = computed(() => {
    const total = presentation.keys.value.length
    return total > 0 && presentation.pressedKeys.value.length === total
  })

  return {
    ...presentation,
    isPressed,
    isPaused: readonly(paused),
    pause: () => { paused.value = true },
    resume: () => { paused.value = false },
    stop,
  }
}
