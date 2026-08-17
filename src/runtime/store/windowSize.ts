import { acceptHMRUpdate, defineStore } from 'pinia'
import { useWindowSize } from '@vueuse/core'

export const useWindowSizeStore = defineStore('windowSizeStore', () => {
  const device = useDevice()

  let initialWidth = 0
  let initialHeight = 0

  if (device.isMobile) {
    initialWidth = 393
    initialHeight = 852
  }
  if (device.isTablet) {
    initialWidth = 992
    initialHeight = 1180
  }
  if (device.isDesktop) {
    initialWidth = 1920
    initialHeight = 1080
  }

  const windowSize = useWindowSize({
    initialWidth,
    initialHeight,
  })

  return {
    windowSize,
  }
})
