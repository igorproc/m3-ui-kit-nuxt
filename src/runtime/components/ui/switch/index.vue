<template>
  <label
    class="ui-switch"
    :class="switchClasses"
  >
    <input
      :id="fieldId"
      v-model="modelValue"
      class="ui-switch__input"
      type="checkbox"
      :name="path"
      :disabled="disabled"
      role="switch"
      :aria-checked="modelValue"
      :aria-invalid="hasError ? 'true' : undefined"
    >

    <span class="ui-switch__track">
      <span class="ui-switch__thumb-container">
        <span class="ui-switch__thumb" />
        <span class="ui-switch__state-layer" />
      </span>
    </span>

    <span
      v-if="label"
      class="ui-switch__label"
    >
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { useField } from '#kit/composables/useField'
import { mSwitchProps } from './props'

const props = defineProps(mSwitchProps)

const modelValue = defineModel<boolean>({ default: false })

const fieldId = useId()

// Coerce the synced field value to a strict boolean (the native switch
// contract) without mutating the shared `useField` composable.
const booleanModel = computed({
  get: () => modelValue.value,
  set: (next) => {
    modelValue.value = Boolean(next)
  },
})

const { hasError } = useField({ path: props.path, model: booleanModel })

const switchClasses = computed(() => [
  {
    'ui-switch--checked': modelValue.value,
    'ui-switch--disabled': props.disabled,
  },
])
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/switch' as t;

.ui-switch {
  $prefix: 'md-switch';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  gap: g($t, 'gap');
  cursor: pointer;

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__track {
    position: relative;
    width: g($t, 'track-width');
    height: g($t, 'track-height');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'track-bg-color');
    border: g($t, 'track-border-width') solid g($t, 'track-border-color');
    box-sizing: border-box;
    transition:
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__thumb-container {
    position: absolute;
    top: 50%;
    left: g($t, 'track-border-width');
    width: g($t, 'thumb-size-on');
    height: g($t, 'thumb-size-on');
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__thumb {
    width: g($t, 'thumb-size-off');
    height: g($t, 'thumb-size-off');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'thumb-color-off');
    transition:
      width var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      height var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    z-index: 1;
  }

  &__state-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    width: g($t, 'state-layer-size');
    height: g($t, 'state-layer-size');
    transform: translate(-50%, -50%) scale(0.6);
    border-radius: var(--sys-shape-corner-full);
    background-color: map.get($theme-color-link, 'on-surface');
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &--checked &__track {
    background-color: g($t, 'checked-track-bg-color');
    border-color: g($t, 'checked-track-border-color');
  }

  &--checked &__thumb-container {
    transform: translate(g($t, 'checked-thumb-container-translate'), -50%);
  }

  &--checked &__thumb {
    width: g($t, 'thumb-size-on');
    height: g($t, 'thumb-size-on');
    background-color: g($t, 'thumb-color-on');
  }

  &--checked &__state-layer {
    background-color: g($t, 'checked-track-bg-color');
  }

  // Interaction states never apply while disabled (no thumb grow / state layer).
  &:not(.ui-switch--disabled):hover &__state-layer {
    opacity: g($t, 'state-layer-opacity-hover');
    transform: translate(-50%, -50%) scale(1);
  }

  &:not(.ui-switch--disabled):hover &__thumb {
    background-color: g($t, 'thumb-color-hover-off');
  }

  &:not(.ui-switch--disabled):active &__thumb {
    width: g($t, 'thumb-size-active');
    height: g($t, 'thumb-size-active');
  }

  &:not(.ui-switch--disabled):active &__state-layer {
    opacity: g($t, 'state-layer-opacity-active');
  }

  &--checked:not(.ui-switch--disabled):hover &__thumb {
    background-color: g($t, 'thumb-color-hover-on');
  }

  &__label {
    color: g($t, 'label-color');

    @include typescale(g($t, 'label-text-type'));
  }

  /* stylelint-disable no-descending-specificity, selector-class-pattern */
  &--disabled {
    cursor: default;

    .ui-switch__state-layer {
      display: none;
    }

    .ui-switch__track {
      background-color: g($t, 'disabled-track-bg-color');
      border-color: g($t, 'disabled-track-border-color');
    }

    .ui-switch__thumb {
      background-color: g($t, 'disabled-thumb-color');
      opacity: g($t, 'disabled-opacity');
    }

    .ui-switch__label {
      opacity: g($t, 'disabled-opacity');
    }
  }

  &--checked.ui-switch--disabled .ui-switch__track {
    background-color: g($t, 'disabled-checked-track-bg-color');
    border-color: transparent;
  }

  &--checked.ui-switch--disabled .ui-switch__thumb {
    background-color: g($t, 'disabled-checked-thumb-color');
    opacity: 1;
  }
  /* stylelint-enable no-descending-specificity, selector-class-pattern */
}
</style>
