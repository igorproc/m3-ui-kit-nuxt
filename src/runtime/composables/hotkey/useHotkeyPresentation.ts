import { computed } from 'vue'
import {
  buildAriaKeyShortcuts,
  buildAriaLabel,
  buildDisplayKeys,
  normalizeKey,
} from './format'
import { useHotkeyLabels } from './useHotkeyLabels'
import { useHotkeyPlatform } from './useHotkeyPlatform'
import type {
  HotkeyKey,
  HotkeyPlatform,
  HotkeyPresentation,
  ResolvedHotkeyPlatform,
} from '#kit/shared/types/hotkey'

export interface HotkeyPresentationSource {
  keys: () => readonly HotkeyKey[]
  platform: () => HotkeyPlatform
  active: () => boolean
  isHeld?: (token: HotkeyKey, platform: ResolvedHotkeyPlatform) => boolean
}

export function useHotkeyPresentation(source: HotkeyPresentationSource): HotkeyPresentation {
  const labels = useHotkeyLabels()
  const { platform, reserve } = useHotkeyPlatform(source.platform)

  const keys = computed(() => source.keys().map(key => normalizeKey(String(key))))
  const isActive = computed(source.active)
  const displayKeys = computed(() => buildDisplayKeys(keys.value, platform.value, labels.value))
  const ariaLabel = computed(() => buildAriaLabel(displayKeys.value, isActive.value ? undefined : labels.value.disabled))
  const ariaKeyShortcuts = computed(() => buildAriaKeyShortcuts(keys.value, platform.value))
  const reservedKeys = computed(() =>
    reserve.value && platform.value !== 'windows' ? buildDisplayKeys(keys.value, 'windows', labels.value) : [],
  )
  const pressedKeys = computed(() => {
    const isHeld = source.isHeld
    return isHeld ? keys.value.filter(token => isHeld(token, platform.value)) : []
  })

  return { keys, displayKeys, ariaLabel, ariaKeyShortcuts, platform, reservedKeys, isActive, pressedKeys }
}
