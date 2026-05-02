<template>
  <div class="ui-text-field">
    <div
      class="ui-text-field__control"
      :class="controlClasses"
    >
      <div
        v-if="$slots.prepend"
        class="ui-text-field__icon ui-text-field__icon--prepend"
      >
        <slot name="prepend" />
      </div>

      <label
        v-if="label"
        class="ui-text-field__label"
        :for="fieldId"
      >
        {{ label }}
      </label>

      <input
        :id="fieldId"
        v-model="modelValue"
        class="ui-text-field__input"
        :type="type"
        :name="path"
        :placeholder="placeholder"
        :disabled="disabledModel"
        :aria-invalid="!meta.valid"
        :aria-describedby="describedBy"
        @focus="onFocus"
        @blur="onBlur"
      >

      <div
        v-if="$slots.append"
        class="ui-text-field__icon ui-text-field__icon--append"
      >
        <slot name="append" />
      </div>
    </div>

    <p
      v-if="errorMessage"
      :id="`${fieldId}-error`"
      class="ui-text-field__error"
    >
      {{ errorMessage }}
    </p>

    <p
      v-else-if="helperText"
      :id="`${fieldId}-helper`"
      class="ui-text-field__helper"
    >
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'

type TextFieldVariant = 'filled' | 'outlined'

interface Props {
  path: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password'
  disabled?: boolean
  helperText?: string
  variant?: TextFieldVariant
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  variant: 'filled',
})

const modelValue = defineModel<string>({ default: '' })
const disabledModel = defineModel<boolean>('disabled', { default: false })
const isFocused = defineModel<boolean>('focused', { default: false })

const slots = useSlots()
const hasPrepend = computed(() => !!slots.prepend)
const hasAppend = computed(() => !!slots.append)

const fieldId = useId()

const field = useField<string>(() => props.path, undefined)
const { value, meta, errorMessage } = field

watch(
  value,
  (next) => {
    modelValue.value = next ?? ''
  },
  { immediate: true },
)

watch(
  modelValue,
  (next) => {
    value.value = next ?? ''
  },
)

const describedBy = computed(() => {
  if (errorMessage.value) {
    return `${fieldId}-error`
  }

  if (props.helperText) {
    return `${fieldId}-helper`
  }

  return undefined
})

const controlClasses = computed(() => [
  `ui-text-field__control--${props.variant}`,
  {
    'ui-text-field__control--focused': isFocused.value,
    'ui-text-field__control--populated': !!modelValue.value,
    'ui-text-field__control--error': !meta.valid,
    'ui-text-field__control--disabled': disabledModel.value,
    'ui-text-field__control--has-prepend': hasPrepend.value,
    'ui-text-field__control--has-append': hasAppend.value,
  },
])

function onFocus() {
  isFocused.value = true
}

function onBlur() {
  isFocused.value = false
}
</script>

<style lang="scss">
.ui-text-field {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 56rem;
    padding-inline: 16rem;
    border-width: 1rem;
    border-style: solid;
    transition:
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    .ui-text-field__label {
      position: absolute;
      left: 16rem;
      top: 50%;
      transform: translateY(-50%);
      transform-origin: left top;
      transition:
        transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        top var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        font-size var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
      pointer-events: none;
      color: var(--color-surface-variant-contrast);
      z-index: 1;
      max-width: calc(100% - 32rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      // Typography: Body Large
      @include typescale('body-large');
    }

    .ui-text-field__input {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background-color: transparent;
      color: var(--color-surface-contrast);

      // Typography: Body Large
      @include typescale('body-large');

      padding: 0;

      &::placeholder {
        opacity: 0;
        transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
      }
    }

    .ui-text-field__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-on-surface-variant);
      min-width: 24rem;
      font-size: 24rem;

      &--prepend {
        margin-right: 16rem;
      }

      &--append {
        margin-left: 16rem;
      }
    }

    &.ui-text-field__control {
      &--has-prepend {
        padding-left: 12rem;

        .ui-text-field__label {
          left: 52rem;
        }
      }

      &--has-append {
        padding-right: 12rem;
      }
    }

    &.ui-text-field__control--filled {
      border-color: transparent;
      border-bottom: 1rem solid var(--color-on-surface-variant);
      background-color: var(--color-surface-container-highest);
      border-radius: 4rem 4rem 0 0;
      align-items: center;

      .ui-text-field__input {
        padding-top: 24rem;
        padding-bottom: 8rem;
      }

      .ui-text-field__label {
        top: 50%;
      }

      &:hover {
        background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-surface-container-highest));
        border-bottom-color: var(--color-on-surface);
      }
    }

    &.ui-text-field__control--outlined {
      border-color: var(--color-outline);
      background-color: transparent;
      border-radius: 4rem;

      .ui-text-field__label {
        padding-inline: 4rem;
        margin-left: -4rem;
      }

      &:hover {
        border-color: var(--color-on-surface);
      }
    }

    &.ui-text-field__control--error {
      border-color: var(--color-warn) !important;

      .ui-text-field__label {
        color: var(--color-warn) !important;
      }

      &.ui-text-field__control--filled {
        border-bottom-color: var(--color-warn);
      }
    }

    &.ui-text-field__control--disabled {
      opacity: 0.38;
      cursor: default;
      background-color: transparent;
      border-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);

      .ui-text-field__label {
        color: var(--color-on-surface);
      }

      &.ui-text-field__control--filled {
        background-color: color-mix(in srgb, var(--color-on-surface) 4%, transparent);
      }
    }

    // Focused & Populated states (High specificity)
    &.ui-text-field__control--focused,
    &.ui-text-field__control--populated {
      &.ui-text-field__control--filled {
        .ui-text-field__label {
          top: 8rem;
          transform: translateY(0) scale(0.75);
        }

        .ui-text-field__input::placeholder {
          opacity: 1;
        }
      }

      &.ui-text-field__control--outlined {
        .ui-text-field__label {
          top: 0;
          transform: translateY(-50%) scale(0.75);
          background-color: var(--color-surface);
        }

        .ui-text-field__input::placeholder {
          opacity: 1;
        }
      }
    }

    &.ui-text-field__control--focused {
      &.ui-text-field__control--filled {
        background-color: var(--color-surface-container-highest);
        border-bottom-color: var(--color-primary);
        border-bottom-width: 2rem;
      }

      &.ui-text-field__control--outlined {
        border-color: var(--color-primary);
        border-width: 2rem;
        padding-inline: 15rem; // Compensate for 2px border

        .ui-text-field__label {
          color: var(--color-primary);
        }
      }
    }
  }

  &__helper,
  &__error {
    padding-inline: 16rem;
    margin-top: 4rem;

    @include typescale('body-small');
  }

  &__helper {
    color: var(--color-surface-variant-contrast);
  }

  &__error {
    color: var(--color-warn);
  }
}
</style>
