<template>
  <m-text-field
    v-if="field.type === 'text' || field.type === 'search'"
    :path="field.name"
    :label="field.label"
    :placeholder="field.placeholder"
    :type="field.type === 'search' ? 'search' : undefined"
    v-bind="field.props"
  />

  <m-textarea
    v-else-if="field.type === 'textarea'"
    :path="field.name"
    :label="field.label"
    :placeholder="field.placeholder"
    v-bind="field.props"
  />

  <m-number-input
    v-else-if="field.type === 'number'"
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

  <m-dropdown
    v-else-if="field.type === 'select'"
    :path="field.name"
    :label="field.label"
    :placeholder="field.placeholder"
    :items="selectItems"
    item-value="id"
    v-bind="field.props"
  />

  <!-- The group is the field: one adapter binding, one name for native arrow
       keys, one support line for the whole set. -->
  <fieldset
    v-else-if="field.type === 'radio'"
    class="ui-form-renderer-field__group"
  >
    <legend
      v-if="field.label"
      :id="legendId"
      class="ui-form-renderer-field__legend"
    >
      {{ field.label }}
    </legend>

    <m-radio-group
      :path="field.name"
      :name="field.name"
      :aria-labelledby="field.label ? legendId : undefined"
      v-bind="field.props"
    >
      <m-radio
        v-for="option in field.options"
        :key="String(option.value)"
        :value="option.value"
        :label="option.label"
      />
    </m-radio-group>
  </fieldset>
</template>

<script setup lang="ts">
import MCheckbox from '#kit/components/ui/checkbox/index.vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'
import MNumberInput from '#kit/components/ui/number-input/index.vue'
import MRadio from '#kit/components/ui/radio/index.vue'
import MRadioGroup from '#kit/components/ui/radio/group/index.vue'
import MSwitch from '#kit/components/ui/switch/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import MTextarea from '#kit/components/ui/textarea/index.vue'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'

interface Props {
  field: FormFieldConfig
}

const props = defineProps<Props>()

const legendId = `${useId()}-legend`

// The dropdown identifies an item by `id`; an option's value is that id.
const selectItems = computed(() => (props.field.options ?? []).map(option => ({ id: option.value, label: option.label })))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/form-renderer' as t;

.ui-form-renderer-field {
  $t: material-map(t.$tokens, 'md-form-renderer');

  &__group {
    display: flex;
    flex-direction: column;
    gap: g($t, 'group.gap');
    border: none;
    padding: 0;
    margin: 0;
    min-width: 0;
  }

  &__legend {
    padding: 0;
    margin-block-end: g($t, 'legend.margin.bottom');
  }
}
</style>
