<template>
  <div class="ui-time-picker">
    <label
      v-if="label"
      class="ui-time-picker__label"
      :for="fieldId"
    >
      {{ label }}
    </label>

    <div class="ui-time-picker__field">
      <ui-icon
        class="ui-time-picker__icon"
        name="baseline-access-time"
        aria-hidden="true"
      />

      <input
        :id="fieldId"
        v-model="hours"
        class="ui-time-picker__input ui-time-picker__input--hours"
        type="number"
        inputmode="numeric"
        min="0"
        max="23"
        aria-label="Hours"
        @blur="onBlur"
      >

      <span class="ui-time-picker__separator">
        :
      </span>

      <input
        v-model="minutes"
        class="ui-time-picker__input ui-time-picker__input--minutes"
        type="number"
        inputmode="numeric"
        min="0"
        max="59"
        aria-label="Minutes"
        @blur="onBlur"
      >
    </div>

    <p
      v-if="helperText"
      class="ui-time-picker__helper"
    >
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  helperText?: string
}

defineProps<Props>()

const modelValue = defineModel<string>({ default: '' })

const fieldId = useId()

const hours = ref('')
const minutes = ref('')

watch(
  modelValue,
  (next) => {
    if (!next) {
      hours.value = ''
      minutes.value = ''
      return
    }

    const [h, m] = next.split(':')
    hours.value = h ?? ''
    minutes.value = m ?? ''
  },
  { immediate: true },
)

watch(
  [hours, minutes],
  () => {
    const h = clampPart(hours.value, 0, 23)
    const m = clampPart(minutes.value, 0, 59)

    if (h === null || m === null) {
      modelValue.value = ''
      return
    }

    modelValue.value = `${pad2(h)}:${pad2(m)}`
  },
)

function clampPart(value: string, min: number, max: number): number | null {
  if (!value && value !== '0') {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed)) {
    return null
  }

  return Math.min(max, Math.max(min, parsed))
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

function onBlur() {
  // Нормализуем значения при потере фокуса
  const h = clampPart(hours.value, 0, 23)
  const m = clampPart(minutes.value, 0, 59)

  hours.value = h === null ? '' : pad2(h)
  minutes.value = m === null ? '' : pad2(m)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/time-picker' as v;

.ui-time-picker {
  display: flex;
  flex-direction: column;
  gap: v.$gap;

  &__label {
    @include typescale(v.$label-text-type);

    color: v.$label-color;
  }

  &__field {
    display: inline-flex;
    align-items: center;
    gap: v.$field-gap;
    padding-inline: v.$field-padding-inline;
    padding-block: v.$field-padding-block;
    min-height: v.$field-min-height;
    border-radius: v.$field-border-radius;
    border: 1rem solid v.$field-border-color;
    background-color: v.$field-bg-color;
    color: v.$field-text-color;
  }

  &__icon {
    color: v.$icon-color;
    font-size: v.$icon-size;
  }

  &__input {
    width: v.$input-width;
    border: none;
    outline: none;
    background: transparent;
    text-align: center;
    color: v.$input-text-color;

    @include typescale(v.$input-text-type);

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }

    &[type='number'] {
      appearance: textfield;
    }
  }

  &__separator {
    @include typescale(v.$separator-text-type);

    color: v.$separator-color;
  }

  &__helper {
    margin: 0;

    @include typescale(v.$helper-text-type);

    color: v.$helper-color;
  }
}
</style>
