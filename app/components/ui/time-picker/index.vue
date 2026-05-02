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
.ui-time-picker {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  &__label {
    @include typescale('body-medium');

    color: var(--color-on-surface);
  }

  &__field {
    display: inline-flex;
    align-items: center;
    gap: 8rem;
    padding-inline: 12rem;
    padding-block: 8rem;
    min-height: 48rem;
    border-radius: var(--sys-shape-corner-small);
    border: 1rem solid var(--color-outline);
    background-color: var(--color-surface);
    color: var(--color-on-surface);
  }

  &__icon {
    color: var(--color-on-surface-variant);
    font-size: 20rem;
  }

  &__input {
    width: 32rem;
    border: none;
    outline: none;
    background: transparent;
    text-align: center;
    color: var(--color-on-surface);

    @include typescale('body-large');

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
    @include typescale('body-large');

    color: var(--color-on-surface-variant);
  }

  &__helper {
    margin: 0;

    @include typescale('body-small');

    color: var(--color-surface-variant-contrast);
  }
}
</style>
