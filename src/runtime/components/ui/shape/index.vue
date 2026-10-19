<template>
  <svg
    class="ui-shape"
    :viewBox="viewBox"
    fill="none"
    :role="accessibleName ? 'img' : undefined"
    :aria-label="accessibleName"
    :aria-hidden="accessibleName ? undefined : 'true'"
    focusable="false"
    :style="style"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      :d="d"
      fill="currentColor"
      fill-rule="evenodd"
      clip-rule="evenodd"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useShapeMorph } from '#kit/composables/useShapeMorph'
import { M3_SHAPE_SIZE, M3_SHAPES } from '#kit/assets/icon/shapes'
import { mShapeProps } from './props'

const props = defineProps(mShapeProps)

const viewBox = `0 0 ${M3_SHAPE_SIZE} ${M3_SHAPE_SIZE}`

const accessibleName = computed(() => props.label?.trim() || undefined)

const target = computed(() => M3_SHAPES[props.name] || M3_SHAPES['circle'])

const sequence = computed(() =>
  props.sequence?.map(name => M3_SHAPES[name] || M3_SHAPES['circle']),
)

const { d, rotate, transition } = useShapeMorph(target, {
  transition: () => props.transition,
  duration: () => props.duration,
  sequence,
})

const style = computed(() =>
  rotate.value ? { transform: `rotate(${rotate.value.toFixed(2)}deg)` } : undefined,
)

defineExpose({ rotate, transition })
</script>

<style lang="scss">
.ui-shape {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
