import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { injectHotkeyLabels, provideHotkeyLabelsContext } from '#kit/utils/hotkey/labels'
import type { HotkeyLabels } from '#kit/shared/types/hotkey'

/**
 * Names the keys and the disabled state of every hint below, in the app's
 * language. Nested providers merge: each overrides only the names it gives.
 */
export function provideHotkeyLabels(labels: MaybeRefOrGetter<HotkeyLabels>): void {
  const parent = injectHotkeyLabels()
  provideHotkeyLabelsContext(() => ({ ...toValue(parent), ...toValue(labels) }))
}
