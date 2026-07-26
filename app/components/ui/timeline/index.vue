<template>
  <ol
    class="ui-timeline"
    :class="`ui-timeline--density-${density}`"
    :data-side="side"
    :data-line="line"
  >
    <slot />
  </ol>
</template>

<script setup lang="ts">
import { createTimelineContext, provideTimelineContext } from '~/composables/timeline/context'
import { mTimelineProps } from './props'

const props = defineProps(mTimelineProps)

provideTimelineContext(createTimelineContext({
  side: () => props.side,
  density: () => props.density,
  line: () => props.line,
}))
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/timeline/index' as t;

.ui-timeline {
  $t: material-map(t.$tokens, 'md-timeline');

  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  @each $name in ('compact', 'default', 'comfortable') {
    &--density-#{$name} { gap: g($t, 'density-#{$name}-gap'); }
  }
}
</style>
