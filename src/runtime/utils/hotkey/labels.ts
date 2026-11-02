/**
 * @module utils/hotkey/labels
 *
 * @remarks
 * The spoken key names a hint reads, as one context: the kit's defaults from
 * `MESSAGES`, overridden by `provideHotkeyLabels` for a subtree. Internal —
 * `utils/` is not auto-imported; the public provider lives in
 * `composables/hotkey/provideHotkeyLabels`.
 */
import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { MESSAGES } from '#kit/shared/constants/messages'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { HotkeyKeyLabels, HotkeyLabels } from '#kit/shared/types/hotkey'

export type ResolvedHotkeyLabels = HotkeyKeyLabels & Pick<HotkeyLabels, 'disabled'>

export const [injectHotkeyLabels, provideHotkeyLabelsContext] = createContext<MaybeRefOrGetter<HotkeyLabels>>('m3:hotkey-labels', {})

/** The key names in effect here: the kit's defaults under every provided override. */
export function useHotkeyLabels(): ComputedRef<ResolvedHotkeyLabels> {
  const provided = injectHotkeyLabels()
  return computed(() => ({ ...MESSAGES.hotkeyKeys, ...toValue(provided) }))
}
