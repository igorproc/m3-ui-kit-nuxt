<template>
  <component
    :is="tag"
    v-ripple="rippleEnabled"
    :class="rootClass"
    :style="toggleStyle"
    v-bind="rootAttrs"
  >
    <span
      v-if="loading"
      class="ui-button__spinner"
      :class="{ 'ui-button__spinner--centered': !$slots.prepend }"
      aria-hidden="true"
    >
      <MLoading inline />
    </span>

    <span
      v-else-if="$slots.prepend"
      class="ui-button__icon ui-button__icon--prepend"
    >
      <slot name="prepend" />
    </span>

    <span
      v-if="$slots.default"
      class="ui-button__label"
    >
      <slot />
    </span>

    <span
      v-if="$slots.append"
      class="ui-button__icon ui-button__icon--append"
    >
      <slot name="append" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import { useButton } from '#kit/composables/button/useButton'
import { useReducedMotion } from '#kit/composables/useReducedMotion'
import { toggleTransition } from './morph'
import { mButtonProps } from './props'

const props = defineProps(mButtonProps)
const emit = defineEmits<{
  (e: 'update:selected', selected: boolean): void
}>()
const slots = useSlots()

const hasPrepend = computed(() => !!slots.prepend)
const hasAppend = computed(() => !!slots.append)
const hasDefault = computed(() => !!slots.default)

const { tag, rootClass, rootAttrs, rippleEnabled } = useButton({
  block: 'ui-button',
  props,
  modifiers: () => ({
    'has-prepend': hasPrepend.value,
    'has-append': hasAppend.value,
    'icon-only': !hasDefault.value && (hasPrepend.value || hasAppend.value),
  }),
  onToggle: selected => emit('update:selected', selected),
})

const reducedMotion = useReducedMotion()
const toggleStyle = computed(() => (props.selected === undefined ? undefined : { transition: toggleTransition(reducedMotion.value) }))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;

$prefix: 'md-button';
$t: material-map(t.$tokens, $prefix);
$variants: ('filled', 'elevated', 'tonal', 'outlined', 'text');
$densities: ('compact', 'default', 'comfortable');

@mixin paint($path) {
  background-color: g($t, '#{$path}.container.color');
  color: g($t, '#{$path}.content.color');
}

// Applies the tokens of one colour role to every variant. Disabled comes last
// in each variant, so it outranks a selected toggle of the same role.
@mixin apply-scheme($scheme) {
  @each $v in $variants {
    &.ui-button--#{$v} {
      $base: '#{$scheme}.#{$v}';
      $disabled: '#{$scheme}.disabled';

      @include paint($base);

      @if $v == 'outlined' {
        border-color: g($t, '#{$base}.outline.color');
      }

      &.ui-button--unselected {
        @include paint('#{$base}.unselected');
      }

      &.ui-button--selected {
        @include paint('#{$base}.selected');

        @if $v == 'outlined' {
          border-color: transparent;
        }
      }

      &.ui-button--disabled {
        color: g($t, '#{$disabled}.content.color');

        @if $v == 'outlined' or $v == 'text' {
          background-color: transparent;
        } @else {
          background-color: g($t, '#{$disabled}.container.color');
        }

        @if $v == 'outlined' {
          border-color: g($t, '#{$disabled}.outline.color');

          &.ui-button--selected {
            background-color: g($t, '#{$disabled}.container.color');
            border-color: transparent;
          }
        }

        @include forced-colors {
          border-color: GrayText;
          color: GrayText;
        }
      }
    }
  }
}

.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  isolation: isolate;
  max-width: 100%;
  cursor: pointer;
  text-decoration: none;
  border: none;
  background-color: transparent;
  outline: none;
  border-radius: g($t, 'container.shape');

  // `border-radius` stays out: a plain button never changes shape. A toggle
  // replaces this list inline with its spring morph (`morph.ts`).
  transition:
    background-color g($t, 'state.duration') g($t, 'state.easing'),
    color g($t, 'state.duration') g($t, 'state.easing'),
    box-shadow g($t, 'state.duration') g($t, 'state.easing'),
    border-color g($t, 'state.duration') g($t, 'state.easing'),
    transform g($t, 'state.duration') g($t, 'state.easing');

  // State layer in the button's own content colour (craft.md, «Подмена фона»).
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-color: currentcolor;
    opacity: 0;
    pointer-events: none;
    transition: opacity g($t, 'state.duration') g($t, 'state.easing');
  }

  @include can-hover {
    &:hover:not(.ui-button--disabled)::before {
      opacity: g($t, 'state.hover');
    }
  }

  // Covers the whole family — icon/split inherit `.ui-button`.
  &:focus-visible {
    @include focus-ring;

    &:not(.ui-button--disabled)::before {
      opacity: g($t, 'state.focus');
    }
  }

  // Filled, tonal, elevated and text buttons draw their edge with a background
  // or a shadow, which forced colors drops; outlined keeps its own border.
  @include forced-colors {
    border: 1px solid ButtonText;
  }

  &--outlined {
    border: g($t, 'container.outline.width') solid transparent;
  }

  // The button grows with its label rather than clipping it; an unbroken
  // string (a URL, an article number) wraps instead of pushing the button
  // past its container.
  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: center;
    z-index: 1;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    z-index: 1;
  }

  // Sizes the inline MLoading like the icon it stands in for.
  &__spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    flex-shrink: 0;
    z-index: 1;

    // With no icon to stand in for, the spinner sits over the content, which
    // keeps its box (and its accessible name) so the width does not jump.
    &--centered {
      position: absolute;
      inset: 0;

      ~ .ui-button__label,
      ~ .ui-button__icon {
        opacity: 0;
      }
    }
  }

  @each $step in $densities {
    &--#{$step} {
      $d: 'density.#{$step}';

      min-height: g($t, '#{$d}.height');
      gap: g($t, '#{$d}.gap');
      padding-inline: g($t, '#{$d}.padding');

      @include typescale(g($t, '#{$d}.font'));

      .ui-button__icon,
      .ui-button__spinner {
        font-size: g($t, '#{$d}.icon');
      }

      // A selected toggle is square whatever its resting shape (M3
      // ToggleButton `checkedShape`), and keeps it while disabled or loading;
      // it gets there on a spring (`morph.ts`).
      &.ui-button--square,
      &.ui-button--selected {
        border-radius: g($t, '#{$d}.square');
      }
    }
  }

  // An icon with no label is an icon button: its square and its glyph size.
  &--icon-only {
    padding-inline: 0;

    @each $step in $densities {
      &.ui-button--#{$step} {
        width: g($t, 'density.#{$step}.height');

        .ui-button__icon,
        .ui-button__spinner {
          font-size: g($t, 'icon-button.density.#{$step}.icon');
        }
      }
    }
  }

  // Drawn under 48 (compact, every icon button), a button still takes a 48
  // pointer target, centred on it; at 48 and above the inset resolves to 0.
  &--compact::after,
  &.ui-icon-button::after {
    content: '';
    position: absolute;
    inset: min(0rem, calc((100% - #{g($t, 'target.size')}) / 2));
  }

  @include apply-scheme('primary');

  &--secondary {
    @include apply-scheme('secondary');
  }

  &--tertiary {
    @include apply-scheme('tertiary');
  }

  &--error {
    @include apply-scheme('error');
  }

  // No role (set by MButtonIcon when it has no `color`): a standard or outlined
  // button takes its container's content colour (Compose LocalContentColor)
  // until it is selected, which needs one. Kept at the role schemes'
  // specificity, so a host that recolours the button still wins.
  &--current {
    &.ui-button--text,
    &.ui-button--outlined {
      color: inherit;

      &.ui-button--unselected:not(.ui-button--disabled) {
        color: inherit;
      }
    }
  }

  &--elevated {
    box-shadow: g($t, 'elevation.elevated.rest');
  }

  @include can-hover {
    &--filled:hover:not(.ui-button--disabled) {
      box-shadow: g($t, 'elevation.filled.hover');
    }

    &--tonal:hover:not(.ui-button--disabled) {
      box-shadow: g($t, 'elevation.tonal.hover');
    }

    &--elevated:hover:not(.ui-button--disabled) {
      box-shadow: g($t, 'elevation.elevated.hover');
    }
  }

  &--elevated:active:not(.ui-button--disabled) {
    box-shadow: g($t, 'elevation.elevated.pressed');
  }

  &--disabled {
    cursor: default;
    pointer-events: none;
    box-shadow: none;
  }

  // Last in the sheet, so it outranks the role schemes' selected fills, which
  // forcing would flatten to Canvas.
  @include forced-colors {
    &.ui-button--selected:not(.ui-button--disabled) {
      background-color: Highlight;
      color: HighlightText;
    }
  }
}
</style>
