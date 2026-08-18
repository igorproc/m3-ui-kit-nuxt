import { computed } from 'vue'
import { useNuxtApp } from '#app'
// Явный импорт: в потребителе кит лежит в node_modules и авто-импорт стора туда
// не инжектится (тот же класс, что useThemeStore is not defined в SSR).
import { useWindowSizeStore } from '#kit/store/windowSize'

export function useSSRWindowSize() {
  // Explicitly pass the Nuxt pinia instance to avoid 'getActivePinia' undefined errors
  // caused by duplicate pinia module installations between layers/workspaces.
  const nuxtApp = useNuxtApp()
  const windowSizeStore = useWindowSizeStore(nuxtApp.$pinia)

  const width = computed(() => windowSizeStore.windowSize.width)
  const height = computed(() => windowSizeStore.windowSize.height)

  return {
    width,
    height,
  }
}
