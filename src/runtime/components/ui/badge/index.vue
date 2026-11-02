<template>
  <span
    v-if="isShown"
    class="ui-badge"
    :class="badgeClasses"
    :role="announce === 'polite' ? 'status' : undefined"
    :aria-live="announce === 'polite' ? 'polite' : undefined"
    :aria-hidden="dot ? 'true' : undefined"
  >
    <span
      v-if="hasLabel"
      class="ui-badge__label"
    >
      <slot>
        {{ displayValue }}
      </slot>
    </span>
  </span>
</template>

<script setup lang="ts">
import { mBadgeProps } from './props'

const props = defineProps(mBadgeProps)
const slots = useSlots()

// With no value, no slot and no dot there is nothing to show: no empty circle.
const hasLabel = computed(() => !props.dot && Boolean(slots.default || displayValue.value))
const isShown = computed(() => props.dot || hasLabel.value)

const displayValue = computed(() => {
  if (props.dot) {
    return ''
  }

  const raw = props.value

  if (raw === undefined || raw === null || raw === '') {
    return ''
  }

  const numeric = Number(raw)

  if (Number.isNaN(numeric)) {
    return String(raw)
  }

  if (numeric > props.max) {
    return `${props.max}+`
  }

  return String(numeric)
})

const badgeClasses = computed(() => ({
  'ui-badge--large': !props.dot,
  'ui-badge--small': props.dot,
}))
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/badge/index' as t;

$prefix: 'm3-badge';

.ui-badge {
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: g($t, 'border.radius');
  background-color: g($t, 'background.color');
  color: g($t, 'text.color');

  &--large {
    min-width: g($t, 'large.size');
    min-height: g($t, 'large.size');
    padding-inline: g($t, 'large.padding.inline');

    @include apply-typography(g($t, 'text.typography'));

    // Forced colors paint the fill as Canvas; the edge keeps the badge's shape.
    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &--small {
    min-width: g($t, 'dot.size');
    min-height: g($t, 'dot.size');
    width: g($t, 'dot.size');
    height: g($t, 'dot.size');
    padding-inline: g($t, 'dot.padding.inline');

    // A dot has no text: its fill is the whole signal, and forced colors
    // would repaint it as Canvas.
    @include forced-colors {
      forced-color-adjust: none;
      background-color: CanvasText;
    }
  }

  &__label {
    display: block;
    max-inline-size: g($t, 'large.max-inline-size');
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
