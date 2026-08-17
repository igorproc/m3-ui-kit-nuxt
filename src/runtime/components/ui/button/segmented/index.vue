<template>
  <div
    class="ui-segmented-button"
    :class="`ui-segmented-button--${color}`"
  >
    <button
      v-for="item in items"
      :key="item.value"
      v-ripple="!isItemDisabled(item)"
      class="ui-segmented-button__segment"
      :class="{
        'ui-segmented-button__segment--selected': isSelected(item.value),
      }"
      :disabled="isItemDisabled(item)"
      @click="selectItem(item.value)"
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
            name="ic:baseline-check"
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
import { mSegmentedProps } from './props'
import type { MSegmentedItem, MSegmentedModelValue } from './props'

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

const isItemDisabled = (item: MSegmentedItem) => props.disabled || !!item.disabled

function isSelected(val: string | number) {
  if (props.multiple && Array.isArray(value.value)) {
    return value.value.includes(val)
  }
  return value.value === val
}

function selectItem(val: string | number) {
  if (props.multiple) {
    const current = Array.isArray(value.value) ? [...value.value] : []
    if (current.includes(val)) {
      value.value = current.filter(i => i !== val)
    } else {
      value.value = [...current, val]
    }
  } else {
    value.value = val
  }
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/segmented' as t;

.ui-segmented-button {
  $prefix: 'm3-segmented';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: stretch;
  height: g($t, 'container-height');
  border-radius: g($t, 'container-shape');
  border: 1rem solid g($t, 'container-outline-color');
  overflow: hidden;

  &__segment {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding-inline: g($t, 'segment-padding-inline');
    gap: g($t, 'segment-gap');
    background-color: g($t, 'unselected-container-color');
    color: g($t, 'unselected-content-color');
    border: none;
    border-right: 1rem solid g($t, 'container-outline-color');
    cursor: pointer;
    outline: none;

    @include typescale(g($t, 'segment-typography'));

    transition:
      background-color g($t, 'motion-duration') g($t, 'motion-easing'),
      color g($t, 'motion-duration') g($t, 'motion-easing');

    &:last-child {
      border-right: none;
    }

    &:hover {
      background-color: g($t, 'unselected-container-hover-color');
    }

    &:active {
      background-color: g($t, 'unselected-container-pressed-color');
    }

    &:disabled {
      color: g($t, 'unselected-content-disabled-color');
      cursor: default;
      pointer-events: none;
    }
  }

  // Selected-segment scheme per MD3 color role.
  @mixin apply-selected($scheme) {
    .ui-segmented-button__segment--selected {
      background-color: g($t, 'selected-#{$scheme}-container-color');
      color: g($t, 'selected-#{$scheme}-content-color');

      &:hover {
        background-color: g($t, 'selected-#{$scheme}-container-hover-color');
      }

      &:active {
        background-color: g($t, 'selected-#{$scheme}-container-pressed-color');
      }
    }
  }

  &--primary { @include apply-selected('primary'); }
  &--secondary { @include apply-selected('secondary'); }
  &--tertiary { @include apply-selected('tertiary'); }
  &--error { @include apply-selected('error'); }

  &__icon {
    font-size: g($t, 'icon-size');
    display: inline-flex;
    width: g($t, 'icon-size');
    height: g($t, 'icon-size');
    align-items: center;
    justify-content: center;
  }

  // Transitions
  .ui-segmented-button-icon-scale {
    &-enter-active,
    &-leave-active {
      transition:
        transform g($t, 'motion-duration') g($t, 'motion-easing'),
        opacity g($t, 'motion-duration') g($t, 'motion-easing');
    }

    &-enter-from,
    &-leave-to {
      transform: scale(0.5);
      opacity: 0;
    }
  }
}
</style>
