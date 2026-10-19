import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { MESSAGES } from '#kit/shared/constants/messages'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { HotkeyKeyLabels, HotkeyLabels } from '#kit/shared/types/hotkey'

export type ResolvedHotkeyLabels = HotkeyKeyLabels & Pick<HotkeyLabels, 'disabled'>

const [injectHotkeyLabels, provideLabels] = createContext<MaybeRefOrGetter<HotkeyLabels>>('m3:hotkey-labels', {})

export function provideHotkeyLabels(labels: MaybeRefOrGetter<HotkeyLabels>): void {
  const parent = injectHotkeyLabels()
  provideLabels(() => ({ ...toValue(parent), ...toValue(labels) }))
}

export function useHotkeyLabels(): ComputedRef<ResolvedHotkeyLabels> {
  const provided = injectHotkeyLabels()
  return computed(() => ({ ...MESSAGES.hotkeyKeys, ...toValue(provided) }))
}
