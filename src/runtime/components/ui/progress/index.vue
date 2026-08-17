<template>
  <ProgressLinear
    v-if="type === 'linear'"
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
import { mProgressProps } from './props'

const props = defineProps(mProgressProps)

const leafProps = computed(() => ({
  value: props.value,
  indeterminate: props.indeterminate,
  size: props.size,
  showTrack: props.showTrack,
  ariaLabel: props.ariaLabel,
  expressive: props.expressive,
}))
</script>
