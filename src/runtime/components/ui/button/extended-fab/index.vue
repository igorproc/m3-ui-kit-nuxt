<template>
  <component
    :is="tag"
    v-ripple="rippleEnabled"
    :class="rootClass"
    v-bind="rootAttrs"
  >
    <span
      v-if="loading"
      class="ui-extended-fab__spinner"
      :class="{ 'ui-extended-fab__spinner--centered': !$slots.prepend }"
      aria-hidden="true"
    >
      <MLoading inline />
    </span>
    <span
      v-else-if="$slots.prepend"
      class="ui-extended-fab__icon"
    >
      <slot name="prepend" />
    </span>
    <span class="ui-extended-fab__label">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { useSlots, watchEffect } from 'vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import { useButton } from '#kit/composables/button/useButton'
import { useFabProps } from '#kit/composables/button/useFabProps'
import { mExtendedFabProps } from './props'

const props = defineProps(mExtendedFabProps)
const slots = useSlots()

const { tag, rootClass, rootAttrs, rippleEnabled } = useButton({
  block: 'ui-extended-fab',
  props: useFabProps('m-button-extended-fab', props),
  modifiers: () => ({ collapsed: !props.expanded }),
})

if (import.meta.dev) {
  watchEffect(() => {
    if (props.expanded || slots.prepend) return

    console.warn('[m-button-extended-fab] `expanded=false` needs a `#prepend` icon to fold to.')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/extended-fab' as t;

.ui-extended-fab {
  $prefix: 'm3-extended-fab';
  $t: material-map(t.$tokens, $prefix);
  $fold: g($t, 'motion.fold.duration') g($t, 'motion.fold.easing');

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  max-width: 100%;
  outline: none;
  box-shadow: g($t, 'container.elevation.resting');
  transition:
    box-shadow g($t, 'motion.duration') g($t, 'motion.easing'),
    background-color g($t, 'motion.duration') g($t, 'motion.easing'),
    width $fold,
    padding $fold,
    gap $fold;

  // Folding animates between the label's width and the square; where `auto`
  // cannot be interpolated the fold is simply instant.
  @supports (interpolate-size: allow-keywords) {
    interpolate-size: allow-keywords;
  }

  &:focus-visible {
    @include focus-ring;
  }

  // The container is only a background and a shadow, both dropped by forced colors.
  @include forced-colors {
    border: 1px solid ButtonText;
  }

  &__icon,
  &__label,
  &__spinner {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
  }

  // The container grows with a long label instead of clipping it.
  &__label {
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: center;
  }

  &__spinner {
    justify-content: center;
    flex-shrink: 0;
    line-height: 0;

    // With no icon to stand in for, the spinner sits over the label, which
    // keeps its box (and its accessible name) so the width does not jump.
    &--centered {
      position: absolute;
      inset: 0;

      ~ .ui-extended-fab__label {
        opacity: 0;
      }
    }
  }

  // One variant's surface for the active scheme. Focus and pressed are separate
  // layers, and pressed comes last: pressing a focused FAB still reads as a press.
  @mixin apply-surface($scheme, $variant) {
    $base: '#{$scheme}.#{$variant}';

    background-color: g($t, '#{$base}.container.color');
    color: g($t, '#{$base}.content.color');

    @include can-hover {
      &:hover:not(.ui-extended-fab--disabled) {
        background-color: g($t, '#{$base}.container.hover-color');
      }
    }

    &:focus-visible:not(.ui-extended-fab--disabled) {
      background-color: g($t, '#{$base}.container.focus-color');
    }

    &:active:not(.ui-extended-fab--disabled) {
      background-color: g($t, '#{$base}.container.pressed-color');
    }

    &.ui-extended-fab--disabled {
      background-color: g($t, '#{$base}.container.disabled-color');
      color: g($t, '#{$base}.content.disabled-color');

      @include forced-colors {
        border-color: GrayText;
        color: GrayText;
      }
    }
  }

  @mixin apply-scheme($scheme) {
    $variants: ('tonal', 'filled');

    @each $v in $variants {
      &.ui-extended-fab--#{$v} {
        @include apply-surface($scheme, $v);
      }
    }
  }

  @mixin apply-density($step) {
    $d: 'density.#{$step}';

    min-height: g($t, '#{$d}.height');
    width: auto;
    border-radius: g($t, '#{$d}.shape');
    padding-inline: g($t, '#{$d}.padding');
    gap: g($t, '#{$d}.gap');

    @include typescale(g($t, '#{$d}.font'));

    .ui-extended-fab__icon,
    .ui-extended-fab__spinner {
      font-size: g($t, '#{$d}.icon');
    }

    // Folded into the FAB of the same step: a square around the icon. The
    // label leaves the layout but stays the accessible name.
    &.ui-extended-fab--collapsed {
      width: g($t, '#{$d}.height');
      padding-inline: 0;
      gap: 0;

      .ui-extended-fab__label {
        @include sr-only;
      }
    }
  }

  // Schemes (MD3 color roles)
  &--primary { @include apply-scheme('primary'); }
  &--secondary { @include apply-scheme('secondary'); }
  &--tertiary { @include apply-scheme('tertiary'); }
  &--error { @include apply-scheme('error'); }

  &--compact { @include apply-density('compact'); }
  &--default { @include apply-density('default'); }
  &--comfortable { @include apply-density('comfortable'); }

  // Interactions
  @include can-hover {
    &:hover:not(.ui-extended-fab--disabled) {
      box-shadow: g($t, 'container.elevation.hover');
    }
  }

  &:active:not(.ui-extended-fab--disabled) {
    box-shadow: g($t, 'container.elevation.pressed');
  }

  &--disabled,
  &--loading {
    box-shadow: none;
    cursor: default;
    pointer-events: none;
  }
}
</style>
