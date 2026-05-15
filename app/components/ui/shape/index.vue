<template>
  <svg
    class="ui-shape"
    viewBox="0 0 380 380"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      :d="currentPath"
      fill="currentColor"
      fill-rule="evenodd"
      clip-rule="evenodd"
    />
  </svg>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { interpolate } from 'flubber'
import { M3_SHAPES, type M3ShapeName } from '~/assets/icon/shapes'

const props = defineProps<{
  name: M3ShapeName
}>()

const currentPath = ref(M3_SHAPES[props.name] || M3_SHAPES['circle'])

let animationFrameId: number

watch(() => props.name, (newName, oldName) => {
  if (newName === oldName || !M3_SHAPES[newName] || !M3_SHAPES[oldName]) {
    currentPath.value = M3_SHAPES[newName] || M3_SHAPES['circle']
    return
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  const startPath = currentPath.value
  const endPath = M3_SHAPES[newName]

  // Create flubber interpolator for smooth SVG morphing
  const interpolator = interpolate(startPath, endPath, { maxSegmentLength: 2 })

  let startTime: number | null = null
  const duration = 600 // 600ms morph duration

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp
    const progress = Math.min((timestamp - startTime) / duration, 1)

    // M3 Standard Easing: cubic-bezier(0.2, 0, 0, 1) - Decelerated easing
    // Approximate with mathematical pow
    const easeProgress = 1 - Math.pow(1 - progress, 4)

    currentPath.value = interpolator(easeProgress)

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    }
  }

  animationFrameId = requestAnimationFrame(animate)
}, { immediate: true })

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style lang="scss">
.ui-shape {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
