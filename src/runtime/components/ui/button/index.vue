<template>
  <component
    :is="tag"
    v-ripple="rippleEnabled"
    :class="rootClass"
    :style="toggleStyle"
    v-bind="bindings()"
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
      <slot
        name="prepend"
        :selected="isSelected"
      />
    </span>

    <span
      v-if="$slots.default"
      class="ui-button__label"
    >
      <slot :selected="isSelected" />
    </span>

    <span
      v-if="$slots.append"
      class="ui-button__icon ui-button__icon--append"
    >
      <slot
        name="append"
        :selected="isSelected"
      />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, mergeProps, useAttrs } from 'vue'
import MLoading from '#kit/components/ui/loading/index.vue'
import { useButton } from '#kit/utils/button/useButton'
import { withoutDestination } from '#kit/utils/link'
import { useReducedMotion } from '#kit/composables/useReducedMotion'
import { toggleTransition } from './morph'
import { mButtonProps } from './props'

defineOptions({ inheritAttrs: false })

const props = defineProps(mButtonProps)
const emit = defineEmits<{
  (e: 'update:selected', selected: boolean): void
}>()
// `selected` lets a toggle swap its glyph (an outlined icon for a filled one):
// a selected text toggle differs from an unselected one in colour alone otherwise.
const slots = defineSlots<{
  default?: (props: { selected: boolean }) => unknown
  prepend?: (props: { selected: boolean }) => unknown
  append?: (props: { selected: boolean }) => unknown
}>()

const hasPrepend = computed(() => !!slots.prepend)
const hasAppend = computed(() => !!slots.append)
const hasDefault = computed(() => !!slots.default)
const isSelected = computed(() => props.selected === true)

const attrs = useAttrs()
const { tag, rootClass, rootAttrs, rippleEnabled, isDisabledLink } = useButton({
  block: 'ui-button',
  props,
  modifiers: () => ({
    'has-prepend': hasPrepend.value,
    'has-append': hasAppend.value,
    'icon-only': !hasDefault.value && (hasPrepend.value || hasAppend.value),
  }),
  onToggle: selected => emit('update:selected', selected),
})

// The consumer's attributes go on the root as they would by fallthrough; a
// disabled link drops a destination passed among them (`href`), too.
function bindings() {
  const merged = mergeProps(rootAttrs.value, attrs)
  return isDisabledLink.value ? withoutDestination(merged) : merged
}

const reducedMotion = useReducedMotion()
const toggleStyle = computed(() => (props.selected === undefined ? undefined : { transition: toggleTransition(reducedMotion.value) }))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;
@use '#kit/assets/stylesheet/components/button/_schemes' as schemes;

$prefix: 'md-button';
$t: material-map(t.$tokens, $prefix);
$densities: ('compact', 'default', 'comfortable');
$icon-only: '.ui-button--icon-only';

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
    border-color g($t, 'state.duration') g($t, 'state.easing');

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

      // An icon-only box keeps its width; there the edge sits inside it.
      // `:where` keeps the step's specificity, so the split's own padding wins.
      &.ui-button--outlined:where(:not(#{$icon-only}, .ui-icon-button)) {
        padding-inline: g($t, '#{$d}.outlined.padding');
      }

      // A toggle's round shape is the step's half height, not `full`: its
      // spring to the square then runs the whole way instead of waiting at
      // 999rem for its last frames (`button/_index.scss`).
      &.ui-button--unselected {
        border-radius: g($t, '#{$d}.round');
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

  @include schemes.schemes($t);
}
</style>
