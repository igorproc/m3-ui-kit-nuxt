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
    <span
      class="ui-extended-fab__label"
      :class="{ 'ui-extended-fab__label--folding': folding }"
      @transitionend.self="onLabelTransitionEnd"
    >
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { ref, useSlots, watch, watchEffect } from 'vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import { useButton } from '#kit/utils/button/useButton'
import { mExtendedFabProps } from './props'

const props = defineProps(mExtendedFabProps)
const slots = useSlots()

const { tag, rootClass, rootAttrs, rippleEnabled } = useButton({
  block: 'ui-extended-fab',
  props,
  modifiers: () => ({ collapsed: !props.expanded }),
})

// While the label opens or closes, it stays on one line: wrapping at the
// width it passes through would grow the button in height for a few frames.
// Settled, a long label may wrap again. The label's opacity always moves on
// a fold, so its end closes the window even where the width cannot animate.
const folding = ref(false)

watch(() => props.expanded, () => {
  folding.value = true
})

function onLabelTransitionEnd(event: TransitionEvent) {
  if (event.propertyName === 'opacity') folding.value = false
}

if (import.meta.dev) {
  watchEffect(() => {
    if (props.expanded || slots.prepend) return

    console.warn('[m-button-extended-fab] `expanded=false` needs a `#prepend` icon to fold to.')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/extended-fab' as t;
@use '#kit/assets/stylesheet/components/button/fab/surface' as surface;

.ui-extended-fab {
  $t: material-map(t.$tokens, 'm3-extended-fab');
  $move: g($t, 'motion.duration') g($t, 'motion.easing');
  $fold: g($t, 'fold.duration') g($t, 'fold.easing');

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  overflow: hidden;
  max-width: 100%;
  outline: none;
  transition: box-shadow $move, background-color $move, color $move, padding $fold;

  // The label opens to its own width; where `auto` cannot be interpolated the
  // fold is simply instant.
  @supports (interpolate-size: allow-keywords) {
    interpolate-size: allow-keywords;
  }

  @include surface.fab-surface($t, 'ui-extended-fab');

  &__icon,
  &__label,
  &__spinner {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
  }

  // Folding closes the label, not the button: the button's width stays `auto`
  // and follows the label frame by frame, so the icon never moves.
  &__label {
    justify-content: center;
    min-width: 0;
    overflow: hidden;
    overflow-wrap: anywhere;
    text-align: center;
    transition: inline-size $fold, margin $fold, opacity $fold;

    &--folding {
      white-space: nowrap;
    }
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

  @each $step in ('compact', 'default', 'comfortable') {
    &--#{$step} {
      $d: 'density.#{$step}';

      min-height: g($t, '#{$d}.height');
      border-radius: g($t, '#{$d}.shape');
      padding-inline: g($t, '#{$d}.padding');

      @include typescale(g($t, '#{$d}.font'));

      .ui-extended-fab__icon,
      .ui-extended-fab__spinner {
        font-size: g($t, '#{$d}.icon');
      }

      .ui-extended-fab__icon ~ .ui-extended-fab__label {
        margin-inline-start: g($t, '#{$d}.gap');
      }

      // Folded into the FAB of the same step: a square around the icon. The
      // label closes to nothing and stays the accessible name.
      &.ui-extended-fab--collapsed {
        padding-inline: g($t, '#{$d}.collapsed.padding');

        .ui-extended-fab__label {
          inline-size: 0;
          margin-inline-start: 0;
          opacity: 0;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
