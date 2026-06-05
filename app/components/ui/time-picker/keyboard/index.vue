<template>
  <div
    class="ui-time-picker-keyboard"
    :class="{ 'ui-time-picker-keyboard--is-dial': isDial }"
  >
    <label
      v-if="label && !isDial"
      class="ui-time-picker-keyboard__label"
      :for="fieldId"
    >
      {{ label }}
    </label>

    <div class="ui-time-picker-keyboard__row">
      <div class="ui-time-picker-keyboard__fields">
        <div class="ui-time-picker-keyboard__field">
          <input
            :id="fieldId"
            v-model="hours"
            class="ui-time-picker-keyboard__input"
            :class="{ 'ui-time-picker-keyboard__input--active': activeField === 'hours' }"
            type="number"
            inputmode="numeric"
            :min="is24h ? 0 : 1"
            :max="is24h ? 23 : 12"
            aria-label="Hours"
            @focus="activeField = 'hours'"
            @blur="onBlur"
          >
          <span class="ui-time-picker-keyboard__field-label">Hour</span>
        </div>

        <span class="ui-time-picker-keyboard__separator">:</span>

        <div class="ui-time-picker-keyboard__field">
          <input
            v-model="minutes"
            class="ui-time-picker-keyboard__input"
            :class="{ 'ui-time-picker-keyboard__input--active': activeField === 'minutes' }"
            type="number"
            inputmode="numeric"
            min="0"
            max="59"
            aria-label="Minutes"
            @focus="activeField = 'minutes'"
            @blur="onBlur"
          >
          <span class="ui-time-picker-keyboard__field-label">Minute</span>
        </div>
      </div>

      <div
        v-if="!is24h"
        class="ui-time-picker-keyboard__ampm"
      >
        <button
          class="ui-time-picker-keyboard__ampm-btn"
          :class="{ 'ui-time-picker-keyboard__ampm-btn--active': period === 'AM' }"
          @click="period = 'AM'"
        >
          AM
        </button>
        <button
          class="ui-time-picker-keyboard__ampm-btn"
          :class="{ 'ui-time-picker-keyboard__ampm-btn--active': period === 'PM' }"
          @click="period = 'PM'"
        >
          PM
        </button>
      </div>
    </div>

    <p
      v-if="helperText && !isDial"
      class="ui-time-picker-keyboard__helper"
    >
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  helperText?: string
  isDial?: boolean
  is24h?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDial: false,
  is24h: true,
})

const modelValue = defineModel<string>({ default: '' })
const fieldId = useId()

const { hours, minutes, activeField, period, onBlur } = useTimePicker(modelValue, toRef(props, 'is24h'))

defineExpose({ activeField, hours, minutes, period })
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/time-picker/keyboard/_index' as t;

.ui-time-picker-keyboard {
  $prefix: 'keyboard';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  gap: g($t, 'container-gap');

  &--is-dial {
    align-items: center;
    justify-content: center;
  }

  &__label {
    color: g($t, 'label-color');

    @include apply-typography(g($t, 'label-typography'));
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12rem;
  }

  &__fields {
    display: flex;
    align-items: center;
    gap: 8rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  &__input {
    width: g($t, 'field-width');
    height: g($t, 'field-height');
    border-radius: g($t, 'field-shape');
    border: none;
    outline: none;
    background-color: g($t, 'field-color-default');
    color: g($t, 'text-color-default');
    text-align: center;
    transition: all 0.2s ease;

    @include apply-typography(g($t, 'text-typography'));

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }

    &[type='number'] {
      appearance: textfield;
    }

    &--active,
    &:focus {
      background-color: g($t, 'field-color-active');
      color: g($t, 'text-color-active');
      border: 2rem solid g($t, 'field-outline-color-active');
    }
  }

  &__field-label {
    color: g($t, 'label-color');
    padding-left: 4rem;

    @include apply-typography(g($t, 'label-typography'));
  }

  &__separator {
    color: g($t, 'separator-color');
    padding-bottom: 24rem; // Align with inputs (offset label height)

    @include apply-typography(g($t, 'separator-typography'));
  }

  &__ampm {
    display: flex;
    flex-direction: column;
    height: g($t, 'field-height');
    border-radius: g($t, 'field-shape');
    border: 1rem solid map.get($theme-color-link, 'outline');
    overflow: hidden;
    margin-bottom: 22rem; // offset label

    &-btn {
      flex: 1;
      padding: 0 12rem;
      border: none;
      background: transparent;
      color: g($t, 'text-color-default');
      cursor: pointer;
      transition: background-color 0.2s;

      @include apply-typography(g($t, 'label-typography'));

      &:first-child {
        border-bottom: 1rem solid g($t, 'ampm-border-color');
      }

      &--active {
        background-color: g($t, 'ampm-background-active');
        color: g($t, 'ampm-color-active');
      }
    }
  }

  &__helper {
    margin: 0;
    color: g($t, 'label-color');

    @include apply-typography(g($t, 'label-typography'));
  }
}
</style>
