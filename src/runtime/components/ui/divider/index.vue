<template>
  <component
    :is="tag"
    class="ui-divider"
    :class="dividerClasses"
    v-bind="semantics"
  />
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { mDividerProps } from './props'
import type { MDividerInset } from './props'
import { useListContext } from '#kit/components/ui/list/context'

const props = defineProps(mDividerProps)
const list = useListContext()

// Inside a list the line is decoration: a separator may not sit among list
// items, and the rows already say where one ends. Anywhere else it is a
// boundary a screen reader announces.
const tag = computed(() => (list.present && list.semantic.value ? 'li' : 'div'))
const semantics = computed(() => (list.present
  ? { 'aria-hidden': 'true' as const }
  : { 'role': 'separator', 'aria-orientation': props.orientation }))

const inset = computed<MDividerInset | undefined>(() => (props.inset === true ? 'start' : props.inset || undefined))

const dividerClasses = computed(() => [
  `ui-divider--${props.orientation}`,
  { [`ui-divider--inset-${inset.value}`]: Boolean(inset.value) },
])

if (import.meta.dev) {
  watchEffect(() => {
    if (typeof props.inset === 'boolean') {
      console.warn('[m-divider] a boolean `inset` is retired: use `inset="start"`, or leave it out for a full-length line.')
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/divider/index' as t;

// Drawn with a border, not a background: forced colors keep a border in the
// user's colours, and an empty box with no width or height cannot outgrow its
// parent the way `width: 100%` plus an inset margin did.
.ui-divider {
  $t: t.$tokens;

  margin: 0;
  padding: 0;
  border: 0 solid g($t, 'color');

  &--horizontal {
    display: block;
    border-block-start-width: g($t, 'thickness');
  }

  // Stretches across a flex row; in running text it stands one line tall.
  &--vertical {
    display: inline-block;
    align-self: stretch;
    min-block-size: 1lh;
    vertical-align: middle;
    border-inline-start-width: g($t, 'thickness');
  }

  // The inset follows the line's own axis, on logical sides.
  @each $side, $horizontal, $vertical in (start margin-inline-start margin-block-start, center margin-inline margin-block, end margin-inline-end margin-block-end) {
    &--horizontal.ui-divider--inset-#{$side} {
      #{$horizontal}: g($t, 'inset.size');
    }

    &--vertical.ui-divider--inset-#{$side} {
      #{$vertical}: g($t, 'inset.size');
    }
  }
}
</style>
