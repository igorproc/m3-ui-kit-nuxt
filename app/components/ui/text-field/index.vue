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
@use '~/assets/stylesheet/components/text-field' as v;

.ui-text-field {
  display: flex;
  flex-direction: column;
  gap: v.$gap;

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: v.$control-min-height;
    padding-inline: v.$control-padding-inline;
    border-width: v.$control-border-width;
    border-style: solid;
    transition:
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    .ui-text-field__label {
      position: absolute;
      left: v.$label-left;
      top: 50%;
      transform: translateY(-50%);
      transform-origin: left top;
      transition:
        transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        top var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        font-size var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
      pointer-events: none;
      color: v.$label-color;
      z-index: 1;
      max-width: calc(100% - 32rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      @include typescale(v.$label-text-type);
    }

    .ui-text-field__input {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background-color: transparent;
      color: v.$input-color;

      @include typescale(v.$input-text-type);

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
      color: v.$icon-color;
      min-width: v.$icon-min-width;
      font-size: v.$icon-font-size;

      &--prepend {
        margin-right: v.$icon-prepend-margin-right;
      }

      &--append {
        margin-left: v.$icon-append-margin-left;
      }
    }

    &.ui-text-field__control {
      &--has-prepend {
        padding-left: v.$control-has-prepend-padding-left;

        .ui-text-field__label {
          left: v.$label-has-prepend-left;
        }
      }

      &--has-append {
        padding-right: v.$control-has-append-padding-right;
      }
    }

    &.ui-text-field__control--filled {
      border-color: transparent;
      border-bottom: 1rem solid v.$filled-border-bottom-color;
      background-color: v.$filled-bg-color;
      border-radius: v.$filled-border-radius;
      align-items: center;

      .ui-text-field__input {
        padding-top: v.$filled-input-padding-top;
        padding-bottom: v.$filled-input-padding-bottom;
      }

      .ui-text-field__label {
        top: 50%;
      }

      &:hover {
        background-color: v.$hover-filled-bg-color;
        border-bottom-color: v.$hover-filled-border-bottom-color;
      }
    }

    &.ui-text-field__control--outlined {
      border-color: v.$outlined-border-color;
      background-color: transparent;
      border-radius: v.$outlined-border-radius;

      .ui-text-field__label {
        padding-inline: v.$outlined-label-padding-inline;
        margin-left: v.$outlined-label-margin-left;
      }

      &:hover {
        border-color: v.$hover-outlined-border-color;
      }
    }

    &.ui-text-field__control--error {
      border-color: v.$error-color !important;

      .ui-text-field__label {
        color: v.$error-color !important;
      }

      &.ui-text-field__control--filled {
        border-bottom-color: v.$error-color;
      }
    }

    &.ui-text-field__control--disabled {
      opacity: v.$disabled-opacity;
      cursor: default;
      background-color: transparent;
      border-color: v.$disabled-border-color;

      .ui-text-field__label {
        color: v.$disabled-label-color;
      }

      &.ui-text-field__control--filled {
        background-color: v.$disabled-filled-bg-color;
      }
    }

    &.ui-text-field__control--focused,
    &.ui-text-field__control--populated {
      &.ui-text-field__control--filled {
        .ui-text-field__label {
          top: v.$filled-active-label-top;
          transform: translateY(0) scale(v.$label-active-scale);
        }

        .ui-text-field__input::placeholder {
          opacity: 1;
        }
      }

      &.ui-text-field__control--outlined {
        .ui-text-field__label {
          top: 0;
          transform: translateY(-50%) scale(v.$label-active-scale);
          background-color: v.$outlined-active-label-bg;
        }

        .ui-text-field__input::placeholder {
          opacity: 1;
        }
      }
    }

    &.ui-text-field__control--focused {
      &.ui-text-field__control--filled {
        background-color: v.$filled-bg-color;
        border-bottom-color: v.$focused-color;
        border-bottom-width: v.$focused-border-width;
      }

      &.ui-text-field__control--outlined {
        border-color: v.$focused-color;
        border-width: v.$focused-border-width;
        padding-inline: v.$focused-outlined-padding-inline;

        .ui-text-field__label {
          color: v.$focused-outlined-label-color;
        }
      }
    }
  }

  &__helper,
  &__error {
    padding-inline: v.$helper-padding-inline;
    margin-top: v.$helper-margin-top;

    @include typescale(v.$helper-text-type);
  }

  &__helper {
    color: v.$helper-color;
  }

  &__error {
    color: v.$error-color;
  }
}
</style>
