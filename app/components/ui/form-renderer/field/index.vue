<template>
  <m-text-field
    v-if="field.type === 'text' || field.type === 'search'"
    :path="field.name"
    :label="field.label"
    :placeholder="field.placeholder"
    v-bind="field.props"
  />

  <m-text-field
    v-else-if="field.type === 'textarea'"
    :path="field.name"
    :label="field.label"
    :placeholder="field.placeholder"
    v-bind="field.props"
  />

  <m-text-field
    v-else-if="field.type === 'number'"
    type="number"
    :path="field.name"
    :label="field.label"
    :placeholder="field.placeholder"
    v-bind="field.props"
  />

  <m-checkbox
    v-else-if="field.type === 'checkbox'"
    :path="field.name"
    :label="field.label"
    v-bind="field.props"
  />

  <m-switch
    v-else-if="field.type === 'switch'"
    :path="field.name"
    :label="field.label"
    v-bind="field.props"
  />

  <fieldset
    v-else-if="field.type === 'radio'"
    class="ui-form-renderer-field__group"
  >
    <legend
      v-if="field.label"
      class="ui-form-renderer-field__legend"
    >
      {{ field.label }}
    </legend>

    <m-radio
      v-for="option in field.options"
      :key="String(option.value)"
      :path="field.name"
      :value="option.value"
      :label="option.label"
      v-bind="field.props"
    />
  </fieldset>
</template>

<script setup lang="ts">
import type { FormFieldConfig } from '~/composables/useFormSchema'

interface Props {
  field: FormFieldConfig
}

defineProps<Props>()
</script>

<style lang="scss">
.ui-form-renderer-field {
  &__group {
    display: flex;
    flex-direction: column;
    gap: 8rem;
    border: none;
    padding: 0;
    margin: 0;
  }

  &__legend {
    padding: 0;
    margin-bottom: 4rem;
  }
}
</style>
