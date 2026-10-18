<template>
  <ol
    class="ui-timeline"
    :class="[`ui-timeline--side-${side}`, `ui-timeline--line-${line}`, `ui-timeline--density-${density}`]"
  >
    <slot />
  </ol>
</template>

<script setup lang="ts">
import { createTimelineContext, provideTimelineContext } from '#kit/composables/timeline/context'
import { mTimelineProps } from './props'

const props = defineProps(mTimelineProps)

provideTimelineContext(createTimelineContext({
  side: () => props.side,
  density: () => props.density,
  line: () => props.line,
}))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/timeline/index' as t;

.ui-timeline {
  $t: material-map(t.$tokens, 'md-timeline');

  // Items collapse `alternate` against the timeline's own width, not the
  // window's (`item/index.vue`).
  container: ui-timeline / inline-size;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  // The space after an item is the item's own padding, so the rail runs
  // through it; the last item has nothing to connect to.
  @each $step in ('compact', 'default', 'comfortable') {
    &--density-#{$step} > .ui-timeline-item:not(:last-child) {
      padding-block-end: g($t, 'density.#{$step}.gap');
    }
  }
}
</style>
