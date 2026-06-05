<template>
  <ProgressLinear
    v-if="variant === 'linear'"
    v-bind="leafProps"
  >
    <slot />
  </ProgressLinear>

  <ProgressCircular
    v-else
    v-bind="leafProps"
  >
    <slot />
  </ProgressCircular>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressLinear from './linear/index.vue'
import ProgressCircular from './circular/index.vue'
import type { ProgressSize, ProgressVariant } from '~/composables/progress/useProgress'

interface Props {
  variant?: ProgressVariant
  value?: number
  indeterminate?: boolean
  size?: ProgressSize
  showTrack?: boolean
  ariaLabel?: string
  expressive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'linear',
  value: 0,
  indeterminate: false,
  size: 'medium',
  showTrack: true,
  ariaLabel: 'Progress',
  expressive: false,
})

const leafProps = computed(() => ({
  value: props.value,
  indeterminate: props.indeterminate,
  size: props.size,
  showTrack: props.showTrack,
  ariaLabel: props.ariaLabel,
  expressive: props.expressive,
}))
</script>
