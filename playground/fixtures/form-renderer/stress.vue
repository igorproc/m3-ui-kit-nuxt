<template>
  <section class="fixture-form-renderer-stress">
    <h1>MFormRenderer — stress content</h1>

    <div class="fixture-form-renderer-stress__column">
      <MFormRenderer
        data-test="form"
        :config="config"
        submit-label="Send the application for review"
        error-summary-title="The application cannot be sent until every required answer below is filled in"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { veeValidateAdapter } from '#kit/adapters/vee-validate'
import MFormRenderer from '#kit/components/ui/form-renderer/index.vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'

provideValidationAdapter(veeValidateAdapter())

const LONG = 'How did you first hear about the programme, and what made you decide to apply this year rather than the next one'

const config: FormFieldConfig[] = [
  { type: 'text', name: 'long', label: LONG, rules: { required: `${LONG}? This answer is required before the application can be sent.` } },
  { type: 'text', name: 'url', label: 'https://example.com/a/very/long/path/without/any/spaces/at/all', rules: { required: true } },
  { type: 'radio', name: 'track', label: 'Track', rules: { required: 'Choose a track' }, options: [
    { label: 'Research, with a supervisor from the partner university and a shared lab', value: 'research' },
    { label: 'Сохранить 保存 حفظ 🙂', value: 'script' },
  ] },
  { type: 'checkbox', name: 'consent', label: 'I agree that the committee may contact the referees I list and keep their letters with my application' },
  ...Array.from({ length: 16 }, (_, index): FormFieldConfig => ({ type: 'text', name: `extra${index + 1}`, label: `Additional answer ${index + 1}` })),
]
</script>

<style lang="scss">
.fixture-form-renderer-stress {
  display: grid;
  gap: 16rem;

  &__column {
    inline-size: 320rem;
    max-inline-size: 100%;
  }
}
</style>
