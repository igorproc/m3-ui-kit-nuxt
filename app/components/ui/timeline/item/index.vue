<template>
  <li
    ref="root"
    class="ui-timeline-item"
    :class="[`ui-timeline-item--${ticket.resolvedSide.value}`, { 'ui-timeline-item--no-opposite': hideOpposite }]"
  >
    <div
      v-if="!hideOpposite"
      class="ui-timeline-item__opposite"
    >
      <slot name="opposite">
        <time
          v-if="time || datetime"
          class="ui-timeline-item__time"
          :datetime="datetime"
        >{{ time }}</time>
      </slot>
    </div>

    <TimelineDivider
      class="ui-timeline-item__divider"
      :first="ticket.first.value"
      :last="ticket.last.value"
      :line="context.line.value"
      :color="color"
      :icon="icon"
      :hide-dot="hideDot"
    >
      <template
        v-if="$slots.dot || $slots.icon"
        #dot
      >
        <slot name="dot">
          <slot name="icon" />
        </slot>
      </template>
    </TimelineDivider>

    <MSurface
      :tag="contentTag"
      :variant="variant"
      class="ui-timeline-item__content"
    >
      <div
        v-if="hasTitle"
        class="ui-timeline-item__title"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div
        v-if="hasBody"
        class="ui-timeline-item__body"
      >
        <slot>{{ text }}</slot>
      </div>
    </MSurface>
  </li>
</template>

<script setup lang="ts">
import MSurface from '~/components/ui/surface/index.vue'
import TimelineDivider from '../divider/index.vue'
import { useTimelineContext } from '~/composables/timeline/context'
import { mTimelineItemProps } from '../props'

const props = defineProps(mTimelineItemProps)

const context = useTimelineContext()
const slots = useSlots()
const root = useTemplateRef<HTMLElement>('root')

const ticket = context.register({
  side: () => props.side,
  element: root,
})

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/timeline/index' as t;

.ui-timeline-item {
  $t: material-map(t.$tokens, 'md-timeline');

  display: grid;

  // opposite | rail | content — the resolved side swaps which outer column the
  // content occupies, so the DOM order never changes for presentation.
  grid-template-columns: minmax(0, 1fr) g($t, 'rail-width') minmax(0, 1fr);
  column-gap: g($t, 'content-gap');
  align-items: stretch;

  &__opposite {
    display: flex;
    align-items: flex-start;
    padding-block: g($t, 'content-padding-block');
  }

  &__divider {
    grid-column: 2;
    grid-row: 1;
  }

  &__content {
    padding-block: g($t, 'content-padding-block');
  }

  // Resolved end side: content in the trailing column, opposite in the leading.
  &--end {
    .ui-timeline-item__opposite {
      grid-column: 1;
      justify-content: flex-end;
      text-align: end;
    }

    .ui-timeline-item__content { grid-column: 3; }
  }

  // Resolved start side: mirror the two content columns.
  &--start {
    .ui-timeline-item__opposite { grid-column: 3; }
    .ui-timeline-item__content { grid-column: 1; }
  }

  // Without an opposite column, content spans from the rail to the far edge.
  &--no-opposite {
    grid-template-columns: g($t, 'rail-width') minmax(0, 1fr);

    .ui-timeline-item__divider { grid-column: 1; }
    .ui-timeline-item__content { grid-column: 2; }
  }

  &__time {
    color: g($t, 'time-color');

    @include apply-typography(g($t, 'time-typography'));
  }

  &__title {
    @include apply-typography(g($t, 'title-typography'));
  }

  &__body {
    @include apply-typography(g($t, 'body-typography'));
  }

  // Alternate collapses to end-side on narrow viewports; DOM stays chronological.
  @media only screen and (max-width: #{g($t, 'collapse-threshold')}) {
    [data-side='alternate'] & {
      grid-template-columns: g($t, 'rail-width') minmax(0, 1fr);

      .ui-timeline-item__opposite {
        grid-column: 2;
        justify-content: flex-start;
        text-align: start;
      }

      .ui-timeline-item__divider { grid-column: 1; }
      .ui-timeline-item__content { grid-column: 2; }
    }
  }
}
</style>
