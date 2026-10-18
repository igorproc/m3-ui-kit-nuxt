<template>
  <li
    ref="root"
    class="ui-timeline-item"
    :class="[`ui-timeline-item--${ticket.resolvedSide.value}`, { 'ui-timeline-item--no-dot': hideDot }]"
  >
    <div
      v-if="hasOpposite"
      class="ui-timeline-item__opposite"
    >
      <slot name="opposite">
        <time
          class="ui-timeline-item__time"
          :datetime="datetime"
        >{{ time }}</time>
      </slot>
    </div>

    <TimelineDivider
      class="ui-timeline-item__divider"
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
      <span
        v-if="status"
        class="ui-timeline-item__status"
      >{{ status }}</span>
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
import MSurface from '#kit/components/ui/surface/index.vue'
import TimelineDivider from '#kit/components/fragments/timeline/divider/index.vue'
import { useTimelineContext } from '#kit/composables/timeline/context'
import { mTimelineItemProps } from '../props'

const props = defineProps(mTimelineItemProps)

const context = useTimelineContext()
const slots = useSlots()
const root = useTemplateRef<HTMLElement>('root')

const ticket = context.register({
  side: () => props.side,
  element: root,
})

const hasOpposite = computed(() => !props.hideOpposite && Boolean(slots.opposite || props.time))
const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))

if (import.meta.dev) {
  watchEffect(() => {
    if (props.time && !props.datetime && !slots.opposite) {
      console.warn(`[m-timeline-item] time "${props.time}" has no \`datetime\`: pass the machine-readable timestamp with it.`)
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/timeline/index' as t;

$t: material-map(t.$tokens, 'md-timeline');

// Two columns instead of three: the rail at one inline edge, the content in
// the other column.
@mixin rail-at($edge) {
  @if $edge == start {
    grid-template-columns: g($t, 'rail.width') minmax(0, 1fr);

    &::before,
    &::after {
      inset-inline-start: g($t, 'line.inset');
    }

    .ui-timeline-item__divider { grid-column: 1; }
    .ui-timeline-item__content { grid-column: 2; }
  } @else {
    grid-template-columns: minmax(0, 1fr) g($t, 'rail.width');

    &::before,
    &::after {
      inset-inline: auto g($t, 'line.inset');
    }

    .ui-timeline-item__divider { grid-column: 2; }
    .ui-timeline-item__content { grid-column: 1; }
  }
}

.ui-timeline-item {
  position: relative;
  display: grid;

  // opposite | rail | content — the resolved side swaps which outer column the
  // content occupies, so the DOM order never changes for presentation.
  grid-template-columns: minmax(0, 1fr) g($t, 'rail.width') minmax(0, 1fr);
  column-gap: g($t, 'content.gap');
  align-items: start;

  // The connector is one line over the item's whole height, the space after it
  // included, so it meets the next item's line without a seam. It stops short
  // of the dot, and the ends of the timeline stop at their dots.
  &::before,
  &::after {
    content: '';
    position: absolute;
    inset-inline-start: g($t, 'line.middle');
    border-inline-start: g($t, 'line.width') solid g($t, 'line.color');
    pointer-events: none;
  }

  &::before {
    inset-block-start: 0;
    block-size: g($t, 'line.before');
  }

  &::after {
    inset-block: g($t, 'line.after') 0;
  }

  &:first-child::before,
  &:last-child::after {
    content: none;
  }

  // Without a dot the two halves meet at its centre.
  &--no-dot {
    &::before { block-size: g($t, 'line.center'); }
    &::after { inset-block-start: g($t, 'line.center'); }
  }

  &__opposite {
    display: flex;
    align-items: flex-start;
    grid-row: 1;
    padding-block: g($t, 'opposite.padding.start') g($t, 'content.padding.block');
    overflow-wrap: anywhere;
  }

  &__divider {
    grid-column: 2;
    grid-row: 1;
  }

  &__content {
    grid-row: 1;
    padding-block: g($t, 'content.padding.block');
    overflow-wrap: anywhere;
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

  &__status {
    @include sr-only;
  }

  &__time {
    color: g($t, 'time.color');

    @include apply-typography(g($t, 'time.typography'));
  }

  &__title {
    @include apply-typography(g($t, 'title.typography'));
  }

  &__body {
    @include apply-typography(g($t, 'body.typography'));
  }
}

// Rules that read the parent timeline's modifiers.
.ui-timeline {
  &--line-dashed > .ui-timeline-item {
    &::before,
    &::after {
      border-inline-start-style: dashed;
    }
  }

  &--line-none > .ui-timeline-item {
    &::before,
    &::after {
      content: none;
    }
  }

  // A one-sided timeline where no item has a time drops the empty time column
  // instead of spending half its width on it. Detected in CSS so the server
  // renders it right; `:where()` keeps the detection out of the specificity.
  // Without `:has()` the third column simply stays.
  &--side-end:where(:not(:has(> .ui-timeline-item > .ui-timeline-item__opposite, > .ui-timeline-item--start))) > .ui-timeline-item {
    @include rail-at(start);
  }

  &--side-start:where(:not(:has(> .ui-timeline-item > .ui-timeline-item__opposite, > .ui-timeline-item--end))) > .ui-timeline-item {
    @include rail-at(end);
  }

  // Alternate collapses to one side when the timeline itself is narrow: the
  // time stacks over the content, and the rail spans both rows.
  @container ui-timeline (max-width: #{g($t, 'collapse.threshold')}) {
    &--side-alternate > .ui-timeline-item {
      @include rail-at(start);

      .ui-timeline-item__opposite {
        grid-column: 2;
        justify-content: flex-start;
        padding-block-end: 0;
        text-align: start;
      }

      .ui-timeline-item__divider { grid-row: 1 / span 2; }
      .ui-timeline-item__content { grid-row: auto; }
    }
  }
}
</style>
