<template>
  <div
    class="ui-timeline-divider"
    aria-hidden="true"
  >
    <span
      v-if="!hideDot"
      class="ui-timeline-divider__dot"
      :class="`ui-timeline-divider__dot--${color}`"
    >
      <slot name="dot">
        <MIcon
          v-if="icon"
          class="ui-timeline-divider__icon"
          :name="icon"
        />
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * Private marker leaf of `<MTimelineItem>`: the rail cell and its dot.
 *
 * The connector line is drawn by the item over its whole height, so items
 * meet without a seam; this cell only places the dot on it. Everything here is
 * decorative and hidden from assistive technology — the item's `status`
 * carries the meaning, and event actions belong in the item content.
 */
import type { PropType } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MColor } from '#kit/shared/types/props'

defineProps({
  /** Marker color role. */
  color: { type: String as PropType<MColor>, required: true },
  /** Decorative marker icon. */
  icon: { type: String, default: undefined },
  /** Renders no dot; the item's line runs on through its place. */
  hideDot: { type: Boolean, default: false },
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/timeline/index' as t;

.ui-timeline-divider {
  $t: material-map(t.$tokens, 'md-timeline');

  display: flex;
  justify-content: center;
  width: g($t, 'rail.width');

  &__dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'dot.size');
    height: g($t, 'dot.size');
    margin-block-start: g($t, 'dot.offset');
    border-radius: g($t, 'dot.shape');

    @each $role in ('primary', 'secondary', 'tertiary', 'error') {
      &--#{$role} {
        background-color: g($t, 'dot.color.#{$role}.container');
        color: g($t, 'dot.color.#{$role}.content');
      }
    }
  }

  &__icon { font-size: g($t, 'dot.icon.size'); }

  // The dot is a background, which forced colors drop; the colour roles
  // collapse into one there.
  @include forced-colors {
    &__dot {
      forced-color-adjust: none;
      background-color: CanvasText;
      color: Canvas;
    }
  }
}
</style>
