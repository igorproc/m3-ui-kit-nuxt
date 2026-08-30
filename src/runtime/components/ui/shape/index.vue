<template>
  <svg
    class="ui-shape"
    viewBox="0 0 380 380"
    fill="none"
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
import { M3_SHAPES, type M3ShapeName } from '#kit/assets/icon/shapes'

const props = defineProps<{
  name: M3ShapeName
  /**
   * Optional ordered list of shape names this instance cycles through. When
   * supplied (e.g. by the expressive loading indicator), the morph pre-builds
   * and memoizes interpolators for every adjacent canonical pair — including
   * the loop wrap — avoiding a main-thread hitch on the heaviest transition.
   */
  sequence?: readonly M3ShapeName[]
  /**
   * Morph duration in milliseconds for each transition.
   * @default 600
   */
  duration?: number
}>()

const target = computed(() => M3_SHAPES[props.name] || M3_SHAPES['circle'])

const sequence = computed(() =>
  props.sequence?.map(name => M3_SHAPES[name] || M3_SHAPES['circle']),
)

const { d } = useShapeMorph(target, {
  duration: () => props.duration ?? 600,
  sequence,
})
</script>

<style lang="scss">
.ui-shape {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
