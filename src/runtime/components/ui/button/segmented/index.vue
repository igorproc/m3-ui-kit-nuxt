<template>
  <div
    v-if="items.length"
    v-bind="groupAttrs"
    class="ui-segmented-button"
    :class="[`ui-segmented-button--${color}`, { 'ui-segmented-button--disabled': disabled }]"
  >
    <button
      v-for="(item, index) in items"
      :key="item.value"
      :ref="segmentRef(index)"
      v-ripple="!isItemDisabled(item)"
      v-bind="segmentAttrs(item, index)"
      class="ui-segmented-button__segment"
      :class="segmentModifiers(item)"
    >
      <span class="ui-segmented-button__content">
        <span class="ui-segmented-button__icon">
          <transition
            name="ui-segmented-button-icon-scale"
            mode="out-in"
          >
            <UiIcon
              v-if="isSelected(item.value)"
              key="check"
              :name="ICONS.check"
            />
            <UiIcon
              v-else-if="item.icon"
              :key="item.icon"
              :name="item.icon"
            />
          </transition>
        </span>

        <span
          v-if="item.label"
          class="ui-segmented-button__label"
        >{{ item.label }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import UiIcon from '#kit/components/ui/icon/index.vue'
import { useSegmentedButton } from '#kit/composables/button/useSegmentedButton'
import { ICONS } from '#kit/shared/constants/icons'
import { mSegmentedProps } from './props'
import type { MSegmentedItem, MSegmentedModelValue } from './props'

const props = defineProps(mSegmentedProps)

/** Selected value, or values with `multiple`. */
const value = defineModel<MSegmentedModelValue>()

const { isSelected, isItemDisabled, groupAttrs, segmentAttrs, segmentRef } = useSegmentedButton(value, props)

// Every segment keeps the room for the check, so choosing one changes no width
// (M3 / material-web: segments are equal and the check opens inside one). An
// unselected label segment shows that room empty, so its label is centred by
// sliding the content back over half of it.
function segmentModifiers(item: MSegmentedItem) {
  const selected = isSelected(item.value)
  return {
    'ui-segmented-button__segment--selected': selected,
    'ui-segmented-button__segment--centered': !selected && !item.icon && Boolean(item.label),
  }
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/segmented' as t;

$roles: ('primary', 'secondary', 'tertiary', 'error');

.ui-segmented-button {
  $t: material-map(t.$tokens, 'm3-segmented');
  $move: g($t, 'motion.duration') g($t, 'motion.easing');

  // Equal segments, each as wide as the widest (M3 `weight(1f)`, material-web
  // `grid-auto-columns: 1fr`). A row too wide even with every label wrapped
  // between words scrolls instead of spilling out of its container.
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  max-width: 100%;
  min-height: g($t, 'container.height');
  border-radius: g($t, 'container.shape');
  border: g($t, 'container.outline.width') solid g($t, 'container.outline.color');
  overflow: hidden;
  overflow-x: auto;

  &--disabled {
    border-color: g($t, 'container.outline.disabled.color');
  }

  // State layer in the segment's own content colour; pressed is the ripple.
  &__segment {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding-block: g($t, 'segment.padding.block');
    padding-inline: g($t, 'segment.padding.inline');
    background-color: transparent;
    color: g($t, 'unselected.content.color');
    border: none;
    border-inline-end: g($t, 'container.outline.width') solid g($t, 'container.outline.color');
    cursor: pointer;
    outline: none;
    transition: background-color $move, color $move;

    @include typescale(g($t, 'segment.typography'));

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background-color: currentcolor;
      opacity: 0;
      pointer-events: none;
      transition: opacity $move;
    }

    &:last-child {
      border-inline-end: none;
    }

    @include can-hover {
      &:hover::before {
        opacity: g($t, 'state.hover');
      }
    }

    // Segments sit edge to edge inside a clipped pill: the ring goes inside.
    &:focus-visible {
      @include focus-ring(inset);

      &::before {
        opacity: g($t, 'state.focus');
      }
    }

    &:disabled {
      color: g($t, 'unselected.content.disabled.color');
      cursor: default;
      pointer-events: none;
    }
  }

  &__content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: g($t, 'graphic.gap');
    min-width: g($t, 'segment.content.min-width');
    transition: translate $move;
  }

  &__segment--centered &__content {
    translate: calc(-1 * #{g($t, 'graphic.shift')}) 0;

    &:dir(rtl) {
      translate: g($t, 'graphic.shift') 0;
    }
  }

  &__label {
    text-align: center;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: g($t, 'graphic.size');
    height: g($t, 'graphic.size');
    font-size: g($t, 'graphic.size');
  }

  @each $role in $roles {
    &--#{$role} &__segment--selected {
      background-color: g($t, 'selected.#{$role}.container');
      color: g($t, 'selected.#{$role}.content');
    }
  }

  &__segment--selected:disabled {
    background-color: g($t, 'disabled.selected.container.color');
    color: g($t, 'disabled.content.color');
  }

  // The selected fill is the selection: forcing would flatten it and paint the
  // label's Canvas backplate over Highlight, so that segment opts out of
  // forcing and states its colours in system colours.
  @include forced-colors {
    &__segment:disabled {
      color: GrayText;
    }

    & &__segment--selected {
      forced-color-adjust: none;
      border-inline-end-color: CanvasText;
      background-color: Highlight;
      color: HighlightText;

      &:focus-visible {
        outline-color: CanvasText;
      }

      &:disabled {
        background-color: Canvas;
        color: GrayText;
      }
    }
  }

  // The check scales in and out inside its room.
  .ui-segmented-button-icon-scale {
    &-enter-active,
    &-leave-active {
      transition: transform $move, opacity $move;
    }

    &-enter-from,
    &-leave-to {
      transform: scale(0.5);
      opacity: 0;
    }

    // The check still fades in; it just stops growing.
    @media (prefers-reduced-motion: reduce) {
      &-enter-from,
      &-leave-to {
        transform: none;
      }
    }
  }
}
</style>
