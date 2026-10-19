<template>
  <ol
    class="ui-timeline"
    :class="[`ui-timeline--side-${side}`, `ui-timeline--line-${line}`, `ui-timeline--density-${density}`]"
  >
    <slot />
  </ol>
</template>

<script setup lang="ts">
import { createTimelineContext, provideTimelineContext } from './context'
import { mTimelineProps } from './props'

const props = defineProps(mTimelineProps)

provideTimelineContext(createTimelineContext({
  side: () => props.side,
  density: () => props.density,
  line: () => props.line,
}))
</script>

<style lang="scss">
.ui-timeline {
  // Items collapse `alternate` against the timeline's own width, not the
  // window's (`item/index.vue`).
  container: ui-timeline / inline-size;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
