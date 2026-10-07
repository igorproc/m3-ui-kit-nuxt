import { computed, onMounted, ref, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { useRequestHeaders, useState } from '#app'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { platformFromHints } from './format'
import type { HotkeyPlatform, ResolvedHotkeyPlatform } from '#kit/shared/types/hotkey'

export interface UseHotkeyPlatformReturn {
  platform: ComputedRef<ResolvedHotkeyPlatform>
  reserve: ComputedRef<boolean>
}

type NavigatorWithHints = Navigator & { userAgentData?: { platform?: string } }

export function detectPlatform(): ResolvedHotkeyPlatform {
  if (!IN_BROWSER) return 'windows'
  const hint = (navigator as NavigatorWithHints).userAgentData?.platform
  return platformFromHints(hint, navigator.userAgent) ?? 'windows'
}

function seedPlatform(): ResolvedHotkeyPlatform | null {
  if (IN_BROWSER) return detectPlatform()
  const headers = useRequestHeaders(['sec-ch-ua-platform', 'user-agent'])
  return platformFromHints(headers['sec-ch-ua-platform'], headers['user-agent']) ?? null
}

export function useHotkeyPlatform(option: MaybeRefOrGetter<HotkeyPlatform>): UseHotkeyPlatformReturn {
  const seed = useState<ResolvedHotkeyPlatform | null>('m3:hotkey-platform', seedPlatform)
  const detected = ref<ResolvedHotkeyPlatform>(seed.value ?? 'windows')

  onMounted(() => {
    detected.value = detectPlatform()
  })

  const platform = computed(() => {
    const value = toValue(option)
    return value === 'auto' ? detected.value : value
  })
  const reserve = computed(() => toValue(option) === 'auto' && seed.value === null)

  return { platform, reserve }
}
