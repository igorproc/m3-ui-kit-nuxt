<template>
  <div
    class="ui-text-field"
    :class="[`ui-text-field--${variant}`]"
  >
    <div
      class="ui-text-field__control"
      :class="[
        controlClasses,
        {
          'ui-text-field__control--has-prepend': !!$slots.prepend,
          'ui-text-field__control--has-append': !!$slots.append,
        },
      ]"
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
        :aria-invalid="!meta.valid || props.error || !!props.errorMessage"
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
      v-if="errorMessage || props.errorMessage || (props.error && helperText)"
      :id="`${fieldId}-error`"
      class="ui-text-field__error"
    >
      {{ errorMessage || props.errorMessage || helperText }}
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
  path?: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password'
  disabled?: boolean
  helperText?: string
  variant?: TextFieldVariant
  error?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  path: undefined,
  type: 'text',
  disabled: false,
  variant: 'filled',
  error: false,
  errorMessage: undefined,
})

const modelValue = defineModel<string>({ default: '' })
const disabledModel = defineModel<boolean>('disabled', { default: false })
const isFocused = defineModel<boolean>('focused', { default: false })

const slots = useSlots()

const fieldId = useId()

const field = props.path ? useField<string>(() => props.path!, undefined) : null
const value = field ? field.value : ref(modelValue.value)
const meta = field ? field.meta : reactive({ valid: true })
const errorMessage = field ? field.errorMessage : ref<string | undefined>(undefined)

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
  if (errorMessage.value || props.errorMessage || (props.error && props.helperText)) {
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
    'ui-text-field__control--error': props.error || !!props.errorMessage || !meta.valid,
    'ui-text-field__control--disabled': disabledModel.value,
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
@use '~/assets/stylesheet/components/text-field' as t;

.ui-text-field {
  $prefix: 'm-text-field';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  gap: g($t, 'container-gap');

  &--outlined {
    padding-top: 8rem; // Reserve space for the floating label to prevent CLS
  }

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: g($t, 'container-height');
    padding-inline: g($t, 'container-padding-inline');
    border-width: g($t, 'container-border-width');
    border-style: solid;
    transition:
      border-color g($t, 'state-duration') g($t, 'state-easing'),
      background-color g($t, 'state-duration') g($t, 'state-easing'),
      box-shadow g($t, 'state-duration') g($t, 'state-easing');

    .ui-text-field__label {
      position: absolute;
      left: g($t, 'label-left');
      top: 50%;
      transform: translateY(-50%);
      transform-origin: left top;
      transition:
        transform g($t, 'state-duration') g($t, 'state-easing'),
        top g($t, 'state-duration') g($t, 'state-easing'),
        font-size g($t, 'state-duration') g($t, 'state-easing'),
        color g($t, 'state-duration') g($t, 'state-easing');
      pointer-events: none;
      color: g($t, 'label-color');
      z-index: 1;
      max-width: calc(100% - 32rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      @include typescale(g($t, 'typography-label'));
    }

    .ui-text-field__input {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background-color: transparent;
      color: g($t, 'input-color');

      @include typescale(g($t, 'typography-input'));

      padding: 0;

      &::placeholder {
        opacity: 0;
        transition: opacity g($t, 'state-duration') g($t, 'state-easing');
      }
    }

    .ui-text-field__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: g($t, 'icon-color');
      min-width: g($t, 'icon-width');
      font-size: g($t, 'icon-size');

      &--prepend {
        margin-right: g($t, 'icon-prepend-margin');
      }

      &--append {
        margin-left: g($t, 'icon-append-margin');
      }
    }

    &.ui-text-field__control {
      &--has-prepend {
        padding-left: g($t, 'container-padding-prepend');

        .ui-text-field__label {
          left: g($t, 'label-prepend-left');
        }
      }

      &--has-append {
        padding-right: g($t, 'container-padding-append');
      }
    }

    &.ui-text-field__control--filled {
      border-color: transparent;
      border-bottom: g($t, 'container-border-width') solid g($t, 'filled-border-bottom-color');
      background-color: g($t, 'filled-bg');
      border-radius: g($t, 'filled-radius');
      align-items: center;

      .ui-text-field__input {
        padding-top: g($t, 'filled-input-padding-top');
        padding-bottom: g($t, 'filled-input-padding-bottom');
      }

      .ui-text-field__label {
        top: 50%;
      }

      &:hover {
        background-color: g($t, 'filled-hover-bg');
        border-bottom-color: g($t, 'filled-hover-border-bottom-color');
      }
    }

    &.ui-text-field__control--outlined {
      border-color: g($t, 'outlined-border-color');
      background-color: transparent;
      border-radius: g($t, 'outlined-radius');

      .ui-text-field__label {
        padding-inline: g($t, 'outlined-label-padding-inline');
        margin-left: g($t, 'outlined-label-margin-left');
      }

      &:hover {
        border-color: g($t, 'outlined-hover-border-color');
      }
    }

    &.ui-text-field__control--error {
      border-color: g($t, 'filled-error-border-bottom-color') !important;

      .ui-text-field__label {
        color: g($t, 'filled-error-label-color') !important;
      }

      &.ui-text-field__control--filled {
        border-bottom-color: g($t, 'filled-error-border-bottom-color');
      }

      &.ui-text-field__control--outlined {
        border-color: g($t, 'outlined-error-border-color');

        .ui-text-field__label {
          color: g($t, 'outlined-error-label-color') !important;
        }
      }
    }

    &.ui-text-field__control--disabled {
      cursor: default;
      background-color: transparent;
      border-color: g($t, 'filled-disabled-border-bottom-color');
      color: g($t, 'filled-disabled-input-color');

      .ui-text-field__label {
        color: g($t, 'filled-disabled-label-color');
      }

      .ui-text-field__input {
        color: g($t, 'filled-disabled-input-color');
      }

      .ui-text-field__icon {
        color: g($t, 'filled-disabled-icon-color');
      }

      &.ui-text-field__control--filled {
        background-color: g($t, 'filled-disabled-bg');
        border-bottom-color: g($t, 'filled-disabled-border-bottom-color');
      }

      &.ui-text-field__control--outlined {
        border-color: g($t, 'outlined-disabled-border-color');
        background-color: transparent;

        .ui-text-field__label {
          color: g($t, 'outlined-disabled-label-color');
        }

        .ui-text-field__input {
          color: g($t, 'outlined-disabled-input-color');
        }

        .ui-text-field__icon {
          color: g($t, 'outlined-disabled-icon-color');
        }
      }
    }

    &.ui-text-field__control--focused,
    &.ui-text-field__control--populated {
      &.ui-text-field__control--filled {
        .ui-text-field__label {
          top: g($t, 'filled-active-label-top');
          transform: translateY(0) scale(g($t, 'label-active-scale'));
        }

        .ui-text-field__input::placeholder {
          opacity: 1;
        }
      }

      &.ui-text-field__control--outlined {
        .ui-text-field__label {
          top: 0;
          transform: translateY(-50%) scale(g($t, 'label-active-scale'));
          background-color: g($t, 'outlined-label-bg');
        }

        .ui-text-field__input::placeholder {
          opacity: 1;
        }
      }
    }

    &.ui-text-field__control--focused {
      &.ui-text-field__control--filled {
        background-color: g($t, 'filled-focused-bg');
        border-bottom-color: g($t, 'filled-focused-border-bottom-color');
        border-bottom-width: g($t, 'filled-focused-border-width');

        .ui-text-field__label {
          color: g($t, 'filled-focused-label-color');
        }

        &.ui-text-field__control--error {
          border-bottom-color: g($t, 'filled-error-focused-border-bottom-color');
          .ui-text-field__label {
            color: g($t, 'filled-error-focused-label-color') !important;
          }
        }
      }

      &.ui-text-field__control--outlined {
        border-color: g($t, 'outlined-focused-border-color');
        border-width: g($t, 'outlined-focused-border-width');
        padding-inline: g($t, 'outlined-focused-padding-inline');

        .ui-text-field__label {
          color: g($t, 'outlined-focused-label-color');
        }

        &.ui-text-field__control--error {
          border-color: g($t, 'outlined-error-focused-border-color') !important;
          .ui-text-field__label {
            color: g($t, 'outlined-error-focused-label-color') !important;
          }
        }
      }
    }
  }

  &__helper,
  &__error {
    padding-inline: g($t, 'helper-padding-inline');
    margin-top: g($t, 'helper-margin-top');

    @include typescale(g($t, 'typography-helper'));
  }

  &__helper {
    color: g($t, 'helper-color');
  }

  &__error {
    color: g($t, 'filled-error-helper-color');
  }
}
</style>
