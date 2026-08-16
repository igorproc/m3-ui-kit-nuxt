<template>
  <FieldRoot
    class-prefix="ui-text-field"
    :field-id="fieldId"
    :variant="variant"
    :label="label"
    :focused="isFocused"
    :populated="populated || !!modelValue"
    :error="isError"
    :disabled="disabled"
    :message="displayMessage"
    :message-id="messageId"
  >
    <input
      :id="fieldId"
      v-model="modelValue"
      class="ui-field__input ui-text-field__input"
      v-bind="inputAttrs"
      :type="type"
      :name="name ?? path"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      :aria-invalid="!meta.valid || isError"
      :aria-describedby="describedBy"
      @focus="onFocus"
      @blur="onBlur"
    >

    <template
      v-if="$slots['leading-content']"
      #leading-content
    >
      <slot name="leading-content" />
    </template>

    <template
      v-if="$slots.prepend"
      #prepend
    >
      <slot name="prepend" />
    </template>

    <template
      v-if="$slots.append"
      #append
    >
      <slot name="append" />
    </template>
  </FieldRoot>
</template>

<script setup lang="ts">
import FieldRoot from '~/components/fragments/field/root.vue'
import { mTextFieldProps } from './props'

const props = defineProps(mTextFieldProps)

const modelValue = defineModel<string>({ default: '' })
const isFocused = defineModel<boolean>('focused', { default: false })
const fieldId = useId()

const { errorMessage, isError, meta, onFocus, onBlur } = useTextField({
  path: props.path,
  model: modelValue,
  focused: isFocused,
  error: () => props.error,
  externalError: () => props.errorMessage,
})

const displayMessage = computed(() => errorMessage.value || (props.error ? props.helperText : undefined) || props.helperText)
const messageId = computed(() => isError.value ? `${fieldId}-error` : `${fieldId}-helper`)
const describedBy = computed(() => displayMessage.value ? messageId.value : undefined)
</script>
