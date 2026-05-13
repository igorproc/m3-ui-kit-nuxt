import { computed } from 'vue'
import { useNuxtApp } from '#app'

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
