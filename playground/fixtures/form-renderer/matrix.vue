<template>
  <section class="fixture-form">
    <h1>MFormRenderer — every field type</h1>

    <MFormRenderer
      v-model="values"
      class="fixture-form__form"
      data-test="form"
      :config="config"
      submit-label="Save"
      error-summary-title="Fix these before saving"
      :status-text="status"
      :on-submit="save"
      @submitted="status = 'Saved'"
      @invalid="status = ''"
    />
    <output data-test="values">{{ JSON.stringify(values) }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { veeValidateAdapter } from '#kit/adapters/vee-validate'
import MFormRenderer from '#kit/components/ui/form-renderer/index.vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'

provideValidationAdapter(veeValidateAdapter())

const config: FormFieldConfig[] = [
  { type: 'text', name: 'name', label: 'Name', rules: { required: 'Enter your name' } },
  { type: 'search', name: 'query', label: 'Query' },
  { type: 'textarea', name: 'note', label: 'Note' },
  { type: 'number', name: 'age', label: 'Age', rules: { min: 18 }, props: { incrementLabel: 'More', decrementLabel: 'Less' } },
  { type: 'checkbox', name: 'agree', label: 'Send me the newsletter' },
  { type: 'switch', name: 'news', label: 'Notifications' },
  { type: 'radio', name: 'size', label: 'Size', rules: { required: 'Choose a size' }, options: [{ label: 'Small', value: 's' }, { label: 'Medium', value: 'm' }] },
  { type: 'select', name: 'city', label: 'City', options: [{ label: 'Paris', value: 'paris' }, { label: 'Rome', value: 'rome' }] },
]

const values = ref<Record<string, unknown>>({})
const status = ref('')

function save() {
  status.value = ''
  return new Promise<void>(resolve => setTimeout(resolve, 600))
}
</script>

<style lang="scss">
.fixture-form {
  display: grid;
  gap: 16rem;

  &__form {
    max-inline-size: 480rem;
  }
}
</style>
