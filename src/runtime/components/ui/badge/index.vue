<template>
  <span
    class="ui-badge"
    :class="badgeClasses"
    role="status"
    aria-live="polite"
  >
    <span
      v-if="!dot && displayValue"
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

const badgeClasses = computed(() => [
  {
    'ui-badge--large': !props.dot,
    'ui-badge--small': props.dot,
  },
])
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
  border-radius: g($t, 'border-radius');
  background-color: g($t, 'background-color');
  color: g($t, 'text-color');
  z-index: 1;

  &--large {
    min-width: g($t, 'large-size');
    min-height: g($t, 'large-size');
    padding-inline: g($t, 'large-padding-inline');

    @include apply-typography(g($t, 'text-typography'));
  }

  &--small {
    min-width: g($t, 'dot-size');
    min-height: g($t, 'dot-size');
    width: g($t, 'dot-size');
    height: g($t, 'dot-size');
    padding-inline: g($t, 'dot-padding-inline');
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
