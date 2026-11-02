<template>
  <ProgressLinear
    v-if="type === 'linear'"
    v-bind="leafProps"
  >
    <template
      v-if="$slots.default"
      #default
    >
      <slot />
    </template>
  </ProgressLinear>

  <ProgressCircular
    v-else
    v-bind="leafProps"
  >
    <template
      v-if="$slots.default"
      #default
    >
      <slot />
    </template>
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
  max: props.max,
  valueText: props.valueText,
  indeterminate: props.indeterminate,
  density: props.density,
  showTrack: props.showTrack,
  ariaLabel: props.ariaLabel,
  shape: props.shape,
}))
</script>
