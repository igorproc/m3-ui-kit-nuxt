<template>
  <div
    class="ui-timeline-divider"
    :class="[`ui-timeline-divider--${color}`, `ui-timeline-divider--line-${line}`]"
    aria-hidden="true"
  >
    <span
      class="ui-timeline-divider__line ui-timeline-divider__line--before"
      :class="{ 'is-hidden': first }"
    />

    <span
      v-if="!hideDot"
      class="ui-timeline-divider__dot"
    >
      <slot name="dot">
        <MIcon
          v-if="icon"
          class="ui-timeline-divider__icon"
          :name="icon"
        />
      </slot>
    </span>
    <!-- Keeps the connector aligned when the dot is hidden. -->
    <span
      v-else
      class="ui-timeline-divider__dot ui-timeline-divider__dot--empty"
    />

    <span
      class="ui-timeline-divider__line ui-timeline-divider__line--after"
      :class="{ 'is-hidden': last }"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Private connector/marker leaf of `<MTimelineItem>`.
 *
 * It receives all state as direct props and injects no context: before/after
 * line visibility, the dot and its icon are purely decorative and hidden from
 * assistive technology. Event actions belong in the item content, never here.
 */
import type { PropType } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MColor } from '#kit/shared/types/props'
import type { MTimelineLine } from '#kit/composables/timeline/context'

defineProps({
  /** First item: the leading connector segment is hidden. */
  first: { type: Boolean, required: true },
  /** Last item: the trailing connector segment is hidden. */
  last: { type: Boolean, required: true },
  /** Connector line style, inherited from the parent policy. */
  line: { type: String as PropType<MTimelineLine>, required: true },
  /** Marker color role. */
  color: { type: String as PropType<MColor>, required: true },
  /** Decorative marker icon. */
  icon: { type: String, default: undefined },
  /** Hides the dot while preserving connector geometry. */
  hideDot: { type: Boolean, default: false },
})
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/timeline/index' as t;

.ui-timeline-divider {
  $t: material-map(t.$tokens, 'md-timeline');

  display: flex;
  flex-direction: column;
  align-items: center;
  width: g($t, 'rail-width');
  height: 100%;

  &__line {
    width: g($t, 'line-width');
    flex: 1 1 auto;
    background: g($t, 'line-color');

    &.is-hidden { visibility: hidden; }
  }

  &--line-dashed &__line {
    // A repeating gradient renders the dashed connector without a border.
    background: repeating-linear-gradient(
      to bottom,
      #{g($t, 'line-color')} 0,
      #{g($t, 'line-color')} 4rem,
      transparent 4rem,
      transparent 8rem
    );
  }

  &--line-none &__line { visibility: hidden; }

  &__dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: g($t, 'dot-size');
    height: g($t, 'dot-size');
    border-radius: var(--sys-shape-corner-full);
    background: g($t, 'dot-color');
    color: g($t, 'dot-on-color');

    // A ring in the surface color lifts the dot off the connector line.
    box-shadow: 0 0 0 g($t, 'dot-ring-width') g($t, 'dot-surface');

    &--empty {
      background: transparent;
      box-shadow: none;
    }
  }

  &__icon { font-size: g($t, 'dot-icon-size'); }

  // Marker color roles.
  @each $name in ('primary', 'secondary', 'tertiary', 'error') {
    &--#{$name} .ui-timeline-divider__dot {
      background: g($t, 'dot-color-#{$name}-color');
      color: g($t, 'dot-color-#{$name}-on');
    }
  }
}
</style>
