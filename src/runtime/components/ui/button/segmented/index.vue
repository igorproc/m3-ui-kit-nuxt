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
      :class="{
        'ui-segmented-button__segment--selected': isSelected(item.value),
      }"
    >
      <span
        v-if="isSelected(item.value) || item.icon"
        class="ui-segmented-button__icon"
      >
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
    </button>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import UiIcon from '#kit/components/ui/icon/index.vue'
import { useSegmentedButton } from '#kit/composables/button/useSegmentedButton'
import { ICONS } from '#kit/shared/constants/icons'
import { mSegmentedProps } from './props'
import type { MSegmentedModelValue } from './props'

// Re-exported for backwards compatibility with existing imports.
export type { MSegmentedItem } from './props'

const props = defineProps(mSegmentedProps)

const emit = defineEmits<{
  (e: 'update:modelValue', value: MSegmentedModelValue): void
}>()

const value = useVModel(props, 'modelValue', emit, {
  passive: true,
  deep: true,
})

const { isSelected, isItemDisabled, groupAttrs, segmentAttrs, segmentRef } = useSegmentedButton(value, props)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/segmented' as t;

.ui-segmented-button {
  $prefix: 'm3-segmented';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  min-height: g($t, 'container.height');
  border-radius: g($t, 'container.shape');
  border: 1rem solid g($t, 'container.outline.color');
  overflow: hidden;

  &--disabled {
    border-color: g($t, 'container.outline.disabled.color');
  }

  // Segments keep their natural width and give it up only when the group runs
  // out of room; a label then wraps rather than being cut off.
  &__segment {
    position: relative;
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding-block: g($t, 'segment.padding.block');
    padding-inline: g($t, 'segment.padding.inline');
    gap: g($t, 'segment.gap');
    background-color: g($t, 'unselected.container.color');
    color: g($t, 'unselected.content.color');
    border: none;
    border-inline-end: 1rem solid g($t, 'container.outline.color');
    cursor: pointer;
    outline: none;

    @include typescale(g($t, 'segment.typography'));

    transition:
      background-color g($t, 'motion.duration') g($t, 'motion.easing'),
      color g($t, 'motion.duration') g($t, 'motion.easing');

    &:last-child {
      border-inline-end: none;
    }

    // Segments sit edge to edge inside a clipped pill: the ring goes inside.
    &:focus-visible {
      @include focus-ring(inset);
    }

    @include can-hover {
      &:hover {
        background-color: g($t, 'unselected.container.hover.color');
      }
    }

    &:active {
      background-color: g($t, 'unselected.container.pressed.color');
    }

    &:disabled {
      color: g($t, 'unselected.content.disabled.color');
      cursor: default;
      pointer-events: none;
    }

    @include forced-colors {
      &:disabled {
        color: GrayText;
      }
    }
  }

  &__label {
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: center;
  }

  // Selected-segment scheme per MD3 color role.
  @mixin apply-selected($scheme) {
    .ui-segmented-button__segment--selected {
      background-color: g($t, 'selected.#{$scheme}.container.color');
      color: g($t, 'selected.#{$scheme}.content.color');

      @include can-hover {
        &:hover {
          background-color: g($t, 'selected.#{$scheme}.container.hover.color');
        }
      }

      &:active {
        background-color: g($t, 'selected.#{$scheme}.container.pressed.color');
      }

      &:disabled {
        background-color: g($t, 'disabled.selected.container.color');
        color: g($t, 'disabled.content.color');
      }

      // The fill is the selection, and forced colors drops it: restate it.
      @include forced-colors {
        &,
        &:active {
          background-color: Highlight;
          color: HighlightText;
        }

        @include can-hover {
          &:hover {
            background-color: Highlight;
          }
        }

        &:disabled {
          background-color: Canvas;
          color: GrayText;
        }
      }
    }
  }

  &--primary { @include apply-selected('primary'); }
  &--secondary { @include apply-selected('secondary'); }
  &--tertiary { @include apply-selected('tertiary'); }
  &--error { @include apply-selected('error'); }

  &__icon {
    font-size: g($t, 'icon.size');
    display: inline-flex;
    flex-shrink: 0;
    width: g($t, 'icon.size');
    height: g($t, 'icon.size');
    align-items: center;
    justify-content: center;
  }

  // Transitions
  .ui-segmented-button-icon-scale {
    &-enter-active,
    &-leave-active {
      transition:
        transform g($t, 'motion.duration') g($t, 'motion.easing'),
        opacity g($t, 'motion.duration') g($t, 'motion.easing');
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
